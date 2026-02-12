import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getBudgetAccounts = async (req: Request, res: Response) => {
    try {
        const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
        const accounts = await prisma.budgetAccount.findMany({
            where: { year },
            include: {
                transactions: true,
                expenseRequests: {
                    include: {
                        purchaseOrder: true
                    }
                }
            }
        });

        // Link Budget Items to GL Accounts by NAME.
        const accountsWithExecution = await Promise.all(accounts.map(async (acc) => {
            // 1. Calculate Executed (Devengado) from BudgetTransactions (Reconciled Payments)
            const executedTransactions = acc.transactions.filter(t => t.referenceType === 'EXECUTION');
            const executed = Math.abs(executedTransactions.reduce((sum, t) => sum + t.amount.toNumber(), 0));

            // 2. Calculate Total Committed PO Amount (Approved/Issued/Partial/Received/Closed)
            let totalPOAmount = 0;
            acc.expenseRequests.forEach(req => {
                if (req.purchaseOrder && ['ISSUED', 'PARTIAL', 'RECEIVED', 'CLOSED'].includes(req.purchaseOrder.status)) {
                    totalPOAmount += req.purchaseOrder.totalAmount.toNumber();
                }
            });

            // 3. Committed = Total PO Amount - Executed
            // (Committed serves as the "Pending Execution" amount)
            const committed = Math.max(0, totalPOAmount - executed);

            // 4. Current Balance (Available) = Asignado - Total Usage
            // Total Usage = Committed + Executed
            const totalUsage = committed + executed;
            const currentBalance = acc.allocatedAmount.toNumber() - totalUsage;

            // 5. Alert if Usage > Allocated
            const isAlert = totalUsage > acc.allocatedAmount.toNumber();

            const available = currentBalance;

            return {
                ...acc,
                executed,
                committed,
                currentBalance,
                available,
                isAlert
            };
        }));

        res.json(accountsWithExecution);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch budget accounts' });
    }
};

export const createBudgetAccount = async (req: Request, res: Response) => {
    try {
        const { code, name, allocatedAmount, year } = req.body;
        const existing = await prisma.budgetAccount.findUnique({ where: { code } });
        if (existing && existing.year === year) {
            return res.status(400).json({ error: 'Budget code already exists for this year' });
        }
        const account = await prisma.budgetAccount.create({
            data: {
                code,
                name,
                allocatedAmount,
                year: year || new Date().getFullYear()
            }
        });
        res.json(account);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create budget account' });
    }
};

export const createBudgetTransaction = async (req: Request, res: Response) => {
    try {
        const { budgetAccountId, amount, description, referenceType, referenceId } = req.body;
        const transaction = await prisma.budgetTransaction.create({
            data: {
                budgetAccountId,
                amount,
                description,
                referenceType,
                referenceId
            }
        });
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: 'Failed to register transaction' });
    }
};

export const getBudgetHistory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const budgetId = parseInt(id);

        const budgetAccount = await prisma.budgetAccount.findUnique({
            where: { id: budgetId },
            include: {
                transactions: true,
                expenseRequests: { include: { purchaseOrder: true } }
            }
        });

        if (!budgetAccount) return res.status(404).json({ error: 'Budget account not found' });

        // Get GL Account IDs
        const glAccounts = await prisma.account.findMany({ where: { name: budgetAccount.name } });
        const glAccountIds = glAccounts.map(g => g.id);

        let history: any[] = [];

        // 1. Budget Transactions (Manual adjustments)
        history.push(...budgetAccount.transactions.map(t => ({
            date: t.date,
            type: 'ADJUSTMENT',
            description: t.description,
            amount: t.amount.toNumber(),
            reference: t.referenceType
        })));

        // 2. Journal Entries (Execution)
        if (glAccountIds.length > 0) {
            const lines = await prisma.journalLine.findMany({
                where: {
                    accountId: { in: glAccountIds },
                    debit: { gt: 0 }
                },
                include: { journalEntry: true }
            });
            history.push(...lines.map(l => ({
                date: l.journalEntry.date,
                type: 'EXECUTION',
                description: l.description || l.journalEntry.description,
                amount: l.debit.toNumber(),
                reference: l.journalEntry.reference || `Asiento ${l.journalEntry.id}`
            })));
        }

        // 3. Purchase Orders (Commitments)
        budgetAccount.expenseRequests.forEach(req => {
            if (req.purchaseOrder) {
                history.push({
                    date: req.purchaseOrder.date,
                    type: 'COMMITMENT',
                    description: `Vínculo PO: ${req.description}`,
                    amount: req.purchaseOrder.totalAmount.toNumber(),
                    reference: `PO #${req.purchaseOrder.id}`
                });
            }
        });

        // Sort by date desc
        history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch budget history' });
    }
};
