import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const clearData = async (req: Request, res: Response) => {
    try {
        const { modules } = req.body; // e.g., ['EXPENSES', 'INVOICES', 'TREASURY', 'ACCOUNTING']

        if (!modules || !Array.isArray(modules)) {
            return res.status(400).json({ error: 'Invalid modules provided' });
        }

        // Transaction to ensure atomicity
        await prisma.$transaction(async (prisma) => {
            if (modules.includes('EXPENSES')) {
                // Delete in order to respect Foreign Keys
                await prisma.expenseItem.deleteMany({});
                await prisma.expenseAttachment.deleteMany({});
                await prisma.expenseQuotation.deleteMany({});
                // Break relation with POs before deleting
                await prisma.purchaseOrder.updateMany({ data: { expenseRequestId: null } });
                await prisma.expenseRequest.deleteMany({});
            }

            if (modules.includes('PROCUREMENT')) {
                await prisma.reception.deleteMany({});
                await prisma.asset.deleteMany({}); // Assets linked to PO
                await prisma.invoice.deleteMany({}); // Invoices linked to PO
                await prisma.purchaseOrder.deleteMany({});
            }

            if (modules.includes('BILLING')) {
                await prisma.payment.deleteMany({});
                await prisma.asset.deleteMany({}); // Assets linked to Invoice
                await prisma.invoice.deleteMany({});
            }

            if (modules.includes('TREASURY')) {
                await prisma.bankTransaction.deleteMany({});
                await prisma.payment.deleteMany({});
                // Optional: Delete accounts or just clean balances? 
                // Usually "Clear Data" implies transaction data, not master data.
                // Reset balances to 0
                await prisma.bankAccount.updateMany({ data: { currentBalance: 0 } });
            }

            if (modules.includes('ACCOUNTING')) {
                await prisma.journalLine.deleteMany({});
                await prisma.journalEntry.deleteMany({});
            }
        });

        res.json({ message: 'Datos eliminados exitosamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to clear data', details: error });
    }
};
