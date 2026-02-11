import prisma from '../utils/prisma';
import { NotFoundError, ValidationError } from '../utils/errors';

export class BillingService {
    /**
     * Get invoice with full details
     */
    async getInvoiceById(id: number) {
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                purchaseOrder: true,
                payments: {
                    include: {
                        bankAccount: true
                    }
                },
                assets: true
            }
        });

        if (!invoice) {
            throw new NotFoundError('Factura');
        }

        return invoice;
    }

    /**
     * Calculate invoice payment status
     */
    async calculateInvoiceStatus(invoiceId: number) {
        const invoice = await this.getInvoiceById(invoiceId);

        const totalPaid = invoice.payments.reduce(
            (sum, payment) => sum + Number(payment.amount),
            0
        );

        const totalAmount = Number(invoice.totalAmount);
        const remaining = totalAmount - totalPaid;

        let status: 'UNPAID' | 'PARTIAL' | 'PAID';
        if (totalPaid === 0) {
            status = 'UNPAID';
        } else if (totalPaid >= totalAmount) {
            status = 'PAID';
        } else {
            status = 'PARTIAL';
        }

        return {
            totalAmount,
            totalPaid,
            remaining,
            status,
            paymentPercentage: totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0
        };
    }

    /**
     * Update invoice status based on payments
     */
    async updateInvoiceStatus(invoiceId: number) {
        const { status } = await this.calculateInvoiceStatus(invoiceId);

        return prisma.invoice.update({
            where: { id: invoiceId },
            data: { status }
        });
    }

    /**
     * Create payment and update invoice status
     */
    async createPayment(data: {
        invoiceId: number;
        bankAccountId?: number;
        amount: number;
        date?: Date;
        reference?: string;
    }) {
        const invoice = await this.getInvoiceById(data.invoiceId);
        const { remaining } = await this.calculateInvoiceStatus(data.invoiceId);

        // Validate payment amount
        if (data.amount > remaining) {
            throw new ValidationError(
                `El monto del pago ($${data.amount}) excede el saldo pendiente ($${remaining})`
            );
        }

        if (data.amount <= 0) {
            throw new ValidationError('El monto del pago debe ser mayor a cero');
        }

        // Create payment in transaction
        const payment = await prisma.$transaction(async (tx) => {
            // Create payment
            const newPayment = await tx.payment.create({
                data: {
                    invoiceId: data.invoiceId,
                    bankAccountId: data.bankAccountId,
                    amount: data.amount,
                    date: data.date || new Date(),
                    reference: data.reference
                }
            });

            // Update bank account balance if provided
            if (data.bankAccountId) {
                await tx.bankAccount.update({
                    where: { id: data.bankAccountId },
                    data: {
                        currentBalance: {
                            decrement: data.amount
                        }
                    }
                });

                // Create bank transaction
                await tx.bankTransaction.create({
                    data: {
                        bankAccountId: data.bankAccountId,
                        type: 'WITHDRAWAL',
                        amount: data.amount,
                        description: `Pago de factura ${invoice.number}`,
                        reference: data.reference,
                        date: data.date || new Date()
                    }
                });
            }

            return newPayment;
        });

        // Update invoice status
        await this.updateInvoiceStatus(data.invoiceId);

        return payment;
    }

    /**
     * Get billing statistics
     */
    async getBillingStats() {
        const [totalInvoices, unpaidInvoices, partialInvoices, paidInvoices] = await Promise.all([
            prisma.invoice.count(),
            prisma.invoice.count({ where: { status: 'UNPAID' } }),
            prisma.invoice.count({ where: { status: 'PARTIAL' } }),
            prisma.invoice.count({ where: { status: 'PAID' } })
        ]);

        const unpaidTotal = await prisma.invoice.aggregate({
            where: { status: { in: ['UNPAID', 'PARTIAL'] } },
            _sum: { totalAmount: true }
        });

        return {
            totalInvoices,
            unpaidInvoices,
            partialInvoices,
            paidInvoices,
            totalUnpaid: Number(unpaidTotal._sum.totalAmount || 0)
        };
    }

    /**
     * Get overdue invoices
     */
    async getOverdueInvoices() {
        const today = new Date();

        return prisma.invoice.findMany({
            where: {
                status: { in: ['UNPAID', 'PARTIAL'] },
                dueDate: {
                    lt: today
                }
            },
            include: {
                payments: true
            },
            orderBy: {
                dueDate: 'asc'
            }
        });
    }
}

export const billingService = new BillingService();
