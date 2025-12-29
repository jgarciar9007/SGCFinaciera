import { Request, Response } from 'express';
import prisma from '../utils/prisma';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: number;
        role: string;
    };
}

// Invoices
export const createInvoice = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { purchaseOrderId, number, supplierName, date, dueDate, totalAmount, attachmentPath } = req.body;

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
                date: new Date(date),
                dueDate: dueDate ? new Date(dueDate) : undefined,
                totalAmount: parseFloat(totalAmount),
                status: 'UNPAID',
                attachmentPath // Save PDF path
            }
        });

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
            include: { payments: true }
        });

        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

        const currentPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const newTotalPaid = currentPaid + parseFloat(amount);

        if (newTotalPaid > Number(invoice.totalAmount)) {
            return res.status(400).json({ error: 'Payment amount exceeds invoice total' });
        }

        const payment = await prisma.payment.create({
            data: {
                invoiceId: parseInt(invoiceId),
                amount: parseFloat(amount),
                reference,
                bankAccountId: bankAccountId ? parseInt(bankAccountId) : undefined
            }
        });

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
        const payments = await prisma.payment.findMany({
            include: {
                invoice: true
            },
            orderBy: { date: 'desc' }
        });
        res.json(payments);
    } catch (error) {

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
