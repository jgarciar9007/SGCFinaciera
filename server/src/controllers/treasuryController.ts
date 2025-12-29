import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getBankAccounts = async (req: Request, res: Response) => {
    try {
        const accounts = await prisma.bankAccount.findMany({
            where: { isActive: true },
            include: {
                transactions: {
                    orderBy: { date: 'desc' },
                    take: 5 // Preview generic transactions
                },
                payments: {
                    orderBy: { date: 'desc' },
                    take: 5
                }
            }
        });
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bank accounts' });
    }
};

export const createBankAccount = async (req: Request, res: Response) => {
    try {
        const { name, bankName, accountNumber, initialBalance } = req.body;
        const account = await prisma.bankAccount.create({
            data: {
                name,
                bankName,
                accountNumber,
                currentBalance: initialBalance || 0
            }
        });
        res.json(account);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create bank account' });
    }
};

export const createTransaction = async (req: Request, res: Response) => {
    try {
        const { bankAccountId, type, amount, description, reference } = req.body;

        // Use transaction to ensure balance is updated
        const result = await prisma.$transaction(async (prisma) => {
            const transaction = await prisma.bankTransaction.create({
                data: {
                    bankAccountId: parseInt(bankAccountId),
                    type, // 'DEPOSIT' | 'WITHDRAWAL'
                    amount: parseFloat(amount),
                    description,
                    reference
                }
            });

            // Update Account Balance
            const account = await prisma.bankAccount.findUnique({ where: { id: parseInt(bankAccountId) } });
            if (!account) throw new Error("Account not found");

            const currentBalance = account.currentBalance.toNumber();
            const txAmount = parseFloat(amount);
            const newBalance = type === 'DEPOSIT'
                ? currentBalance + txAmount
                : currentBalance - txAmount;

            await prisma.bankAccount.update({
                where: { id: parseInt(bankAccountId) },
                data: { currentBalance: newBalance }
            });

            return transaction;
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
};

export const getTransactions = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const transactions = await prisma.bankTransaction.findMany({
            where: { bankAccountId: parseInt(id) },
            orderBy: { date: 'desc' }
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
};

export const deleteBankAccount = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const accountId = parseInt(id);

        // Check for dependencies
        const transactionsCount = await prisma.bankTransaction.count({ where: { bankAccountId: accountId } });
        const paymentsCount = await prisma.payment.count({ where: { bankAccountId: accountId } });

        if (transactionsCount > 0 || paymentsCount > 0) {
            // Archive
            await prisma.bankAccount.update({
                where: { id: accountId },
                data: { isActive: false }
            });
            res.json({ message: 'Cuenta archivada debido a que tiene movimientos registrados.' });
        } else {
            // Delete
            await prisma.bankAccount.delete({ where: { id: accountId } });
            res.json({ message: 'Cuenta eliminada exitosamente.' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete bank account' });
    }
};
