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
            // 1. Calculate Executed (Devengado) from GL
            const glAccounts = await prisma.account.findMany({
                where: { name: acc.name }
            });
            const glAccountIds = glAccounts.map(g => g.id);
            let executed = 0;
            if (glAccountIds.length > 0) {
                const aggregations = await prisma.journalLine.aggregate({
                    where: {
                        accountId: { in: glAccountIds },
                        debit: { gt: 0 }
                    },
                    _sum: { debit: true }
                });
                executed = aggregations._sum.debit?.toNumber() || 0;
            }

            // 2. Calculate Committed (Comprometido) from Approved Purchase Orders linked via ExpenseRequest
            // Sum 'totalAmount' of PurchaseOrders where expenseRequest is linked to this budgetAccount
            // Note: We sum ALL linked POs. Logic can be refined to exclude Paid ones if 'Committed' means 'Outstanding'.
            // For now, per user request "sales comprometido son las compras aprobadas", we sum all approved POs.
            let committed = 0;
            acc.expenseRequests.forEach(req => {
                if (req.purchaseOrder && req.purchaseOrder.status !== 'REJECTED') {
                    committed += req.purchaseOrder.totalAmount.toNumber();
                }
            });

            // 3. Current Balance (Saldo Actual) = Asignado - Devengado
            const currentBalance = acc.allocatedAmount.toNumber() - executed;

            // 4. Alert Logic: If Committed > Current Balance
            const isAlert = committed > currentBalance;

            // 5. Final/Available Balance (Saldo Final/Disponible)
            // Ideally: Allocated - MAX(Committed, Executed)? Or Allocated - Executed - (Committed - ExecutedPO)?
            // For simple display as requested:
            // "Saldo Final" usually means Available to Spend.
            // If we assume Committed covers the Executed part:
            // Available = Allocated - (Greatest of Committed or Executed)
            // But if they are decoupled:
            // Let's return simple Available = currentBalance (Asignado - Devengado) for now as 'Saldo Final' column usually tracks cash/gl availability.
            // Or better: Available = Allocated - Committed (if Committed is the leading indicator).
            // Let's stick to: Available = Allocated - Executed (Standard Budget Availability based on actuals),
            // but the Alert warns if we are over-committed.

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
