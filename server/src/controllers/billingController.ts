import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { accountingService } from '../services/accountingService';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: number;
        role: string;
    };
}

// Invoices
export const createInvoice = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { purchaseOrderId, number, supplierName, supplierId, date, dueDate, totalAmount, description, attachmentPath } = req.body;

        // Check duplication
        const existing = await prisma.invoice.findFirst({ where: { number, supplierName } });
        if (existing) return res.status(400).json({ error: 'Invoice number already exists for this supplier' });

        // PO Linking Logic
        let poIdInt: number | undefined;
        if (purchaseOrderId) {
            poIdInt = parseInt(purchaseOrderId);
            const po = await prisma.purchaseOrder.findUnique({
                where: { id: poIdInt },
                include: { invoices: true }
            });

            if (!po) return res.status(404).json({ error: 'Purchase Order not found' });

            // ENFORCE RULE: PO Must be RECEIVED or PARTIAL to invoice
            if (po.status !== 'RECEIVED' && po.status !== 'PARTIAL' && po.status !== 'CLOSED') {
                return res.status(400).json({
                    error: `La Orden de Compra #${po.id} debe estar RECIBIDA para poder facturar. Estado actual: ${po.status}`
                });
            }

            const billedSoFar = po.invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
            const newTotal = billedSoFar + parseFloat(totalAmount);

            if (newTotal > Number(po.totalAmount)) {
                return res.status(400).json({
                    error: `Invoice amount exceeds PO balance. PO Total: ${po.totalAmount}, Billed: ${billedSoFar}, Remaining: ${Number(po.totalAmount) - billedSoFar}`
                });
            }

            // Update PO Status
            const newStatus = newTotal >= Number(po.totalAmount) ? 'CLOSED' : 'PARTIAL';
            await prisma.purchaseOrder.update({
                where: { id: poIdInt },
                data: { status: newStatus }
            });
        }

        const invoice = await prisma.invoice.create({
            data: {
                purchaseOrderId: poIdInt,
                number,
                supplierName,
                // supplierId: supplierId ? parseInt(supplierId) : undefined, // TODO: Add to schema
                date: new Date(date),
                dueDate: dueDate ? new Date(dueDate) : undefined,
                totalAmount: parseFloat(totalAmount),
                // description, // TODO: Add to schema
                status: 'UNPAID',
                attachmentPath
            }
        });

        // --- INTEGRACIÓN CONTABLE AUTOMÁTICA ---
        try {
            await accountingService.recordInvoiceAccrual(invoice, '5195'); // Usar cuenta de gastos diversos
            console.log(`✅ Asiento contable creado para factura ${invoice.number}`);
        } catch (accountingError) {
            console.error('Error al crear asiento contable:', accountingError);
            // No fallar la creación de la factura si falla la contabilidad
        }
        // -----------------------------

        res.json(invoice);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
};

export const getInvoices = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const invoices = await prisma.invoice.findMany({
            include: {
                purchaseOrder: true,
                payments: true
            },
            orderBy: { date: 'desc' }
        });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
};

// Payments
export const createPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { invoiceId, amount, reference, bankAccountId } = req.body;

        const invoice = await prisma.invoice.findUnique({
            where: { id: parseInt(invoiceId) },
            include: {
                payments: true,
                purchaseOrder: {
                    include: {
                        expenseRequest: {
                            include: {
                                budgetAccount: true
                            }
                        }
                    }
                }
            }
        });

        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

        const currentPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const newTotalPaid = currentPaid + parseFloat(amount);
        const paymentAmount = parseFloat(amount);

        if (newTotalPaid > Number(invoice.totalAmount)) {
            return res.status(400).json({ error: 'Payment amount exceeds invoice total' });
        }

        const payment = await prisma.payment.create({
            data: {
                invoiceId: parseInt(invoiceId),
                amount: paymentAmount,
                reference,
                bankAccountId: bankAccountId ? parseInt(bankAccountId) : undefined
            }
        });

        // 1. BANK UPDATE (If Bank Account Selected)
        if (bankAccountId) {
            const bId = parseInt(bankAccountId);
            // Create Transaction
            await prisma.bankTransaction.create({
                data: {
                    bankAccountId: bId,
                    type: 'WITHDRAWAL',
                    amount: paymentAmount,
                    description: `Pago Factura #${invoice.number} - Ref: ${reference || 'N/A'}`,
                    reference: reference,
                    date: new Date()
                }
            });
            // Update Balance
            await prisma.bankAccount.update({
                where: { id: bId },
                data: { currentBalance: { decrement: paymentAmount } }
            });
        }

        // 2. BUDGET EXECUTION (Deduction)
        // Trace: Invoice -> PO -> Expense -> BudgetAccount
        const budgetAccount = invoice.purchaseOrder?.expenseRequest?.budgetAccount;
        if (budgetAccount) {
            await prisma.budgetTransaction.create({
                data: {
                    budgetAccountId: budgetAccount.id,
                    amount: -paymentAmount, // Negative for usage
                    description: `Ejecución Presupuestal - Pago Factura #${invoice.number}`,
                    referenceType: 'PAYMENT',
                    referenceId: payment.id,
                    date: new Date()
                }
            });
            // Update allocatedAmount/executedAmount if you track them cumulatively directly on the model 
            // (Schema has allocatedAmount, maybe we should decrement it or have a separate 'executed' field? 
            // For now, transaction log is enough, but updating the 'allocatedAmount' might count as 'remaining'. 
            // Let's assume allocatedAmount is the limit, and we just track transactions. 
            // But usually 'Available' = Allocated + Sum(Transactions). 
            // So adding a negative transaction is correct.)
        }

        // 3. ACCOUNTING JOURNAL ENTRY
        // Debit: AP Account (Proveedores - 2101)
        // Credit: Bank Account (Bancos - 1110)
        // If no bank selected, maybe Cash (Caja - 1105)?
        const apAccount = await prisma.account.findFirst({ where: { code: '2101' } });
        const bankGLAccount = await prisma.account.findFirst({ where: { code: '1110' } });

        if (apAccount && bankGLAccount) {
            await prisma.journalEntry.create({
                data: {
                    date: new Date(),
                    description: `Pago Factura #${invoice.number} - ${invoice.supplierName}`,
                    reference: `PAY-${payment.id}`,
                    status: 'POSTED',
                    lines: {
                        create: [
                            {
                                accountId: apAccount.id,
                                debit: paymentAmount, // Debit Liability to decrease it
                                credit: 0,
                                description: `Pago a Proveedor ${invoice.supplierName}`
                            },
                            {
                                accountId: bankGLAccount.id,
                                debit: 0,
                                credit: paymentAmount, // Credit Asset (Bank) to decrease it
                                description: `Salida de Banco - Ref: ${reference}`
                            }
                        ]
                    }
                }
            });
        }

        // Update Invoice Status
        let newStatus = 'PARTIAL';
        if (newTotalPaid >= Number(invoice.totalAmount)) {
            newStatus = 'PAID';
        }

        await prisma.invoice.update({
            where: { id: parseInt(invoiceId) },
            data: { status: newStatus }
        });

        res.json(payment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create payment' });
    }
};

export const getPayments = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { bankAccountId, status } = req.query;
        const where: any = {};

        if (bankAccountId) where.bankAccountId = parseInt(bankAccountId as string);
        if (status) where.status = status;

        const payments = await prisma.payment.findMany({
            where,
            include: {
                invoice: true
            },
            orderBy: { date: 'desc' }
        });
        res.json(payments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
};

export const uploadInvoiceAttachment = async (req: any, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Return relative path for storage
        const filePath = `/uploads/${req.file.filename}`;
        res.json({ path: filePath });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
};

// NEW: Pay Invoice with Bank Account Selection
export const payInvoice = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const invoiceId = parseInt(req.params.id);
        const { bankAccountId, paymentDate, reference, notes } = req.body;

        if (!bankAccountId) {
            return res.status(400).json({ error: 'Bank account is required' });
        }

        // Get invoice
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        if (invoice.status === 'PAID') {
            return res.status(400).json({ error: 'Invoice is already paid' });
        }

        // Process payment using accounting service
        const result = await accountingService.recordInvoicePayment(
            invoice,
            parseInt(bankAccountId),
            reference,
            paymentDate ? new Date(paymentDate) : undefined
        );

        res.json({
            success: true,
            message: `Factura ${invoice.number} pagada exitosamente`,
            newBankBalance: result.newBalance,
            invoice: result.invoice
        });
    } catch (error: any) {
        console.error('Error al pagar factura:', error);
        res.status(500).json({ error: error.message || 'Failed to pay invoice' });
    }
};
