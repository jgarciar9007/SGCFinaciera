import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getDashboardStats = async (req: Request, res: Response) => {
    const log = console.log;
    try {
        const currentYear = new Date().getFullYear();

        // 1. Bank Summary & Total Cash
        // const bankAccounts = await prisma.bankAccount.findMany();
        // log(`[Dashboard] 1. Done. Banks: ${bankAccounts.length}`);



        log('[Dashboard] 1. Fetching Bank Accounts...');
        const bankAccounts = await prisma.bankAccount.findMany({ where: { isActive: true } });
        const totalCash = bankAccounts.reduce((sum, acc) => sum + acc.currentBalance.toNumber(), 0);
        log(`[Dashboard] 1. Done. Banks: ${bankAccounts.length}`);

        // 2. Pending Payments (Invoices)
        log('[Dashboard] 2. Fetching Pending Invoices...');
        const pendingInvoicesCount = await prisma.invoice.count({ where: { status: { not: 'PAID' } } });
        const pendingInvoicesTotal = await prisma.invoice.aggregate({
            _sum: { totalAmount: true },
            where: { status: { not: 'PAID' } }
        });

        // 3. Budget Overview (Simplified Aggregation)
        log('[Dashboard] 3. Fetching Budget...');
        // We need: Allocated, Committed, Executed
        const budgetAccounts = await prisma.budgetAccount.findMany({
            where: { year: currentYear },
            include: {
                expenseRequests: { include: { purchaseOrder: true } }
            }
        });

        let totalAllocated = 0;
        let totalCommitted = 0;
        let totalExecuted = 0; // Using simplified calculation if possible, else we need GL check

        // For Total Executed, it's faster to verify via JournalLines directly on expense accounts (Class 6)
        // assuming standard accounting. 
        // For accurate per-budget-line execution, we usually match by Name (as per budgetController).
        // Let's do a GL aggregate for Class 6 accounts for correct "Executed" total.
        const expenseAccounts = await prisma.account.findMany({
            where: { code: { startsWith: '5' } } // Class 5 is Expenses
        });
        const expenseAccountIds = expenseAccounts.map(a => a.id);

        if (expenseAccountIds.length > 0) {
            const executionAgg = await prisma.journalLine.aggregate({
                _sum: { debit: true },
                where: { accountId: { in: expenseAccountIds } }
            });
            totalExecuted = executionAgg._sum.debit?.toNumber() || 0;
        }

        budgetAccounts.forEach(acc => {
            totalAllocated += acc.allocatedAmount.toNumber();
            acc.expenseRequests.forEach(req => {
                if (req.purchaseOrder && req.purchaseOrder.status !== 'REJECTED') {
                    totalCommitted += req.purchaseOrder.totalAmount.toNumber();
                }
            });
        });

        const budgetExecutionPercent = totalAllocated > 0 ? (totalExecuted / totalAllocated) * 100 : 0;


        // 4. Recent Activity
        log('[Dashboard] 4. Fetching Recent Activity...');
        const recentExpenses = await prisma.expenseRequest.findMany({
            take: 5,
            orderBy: { updatedAt: 'desc' },
            where: { status: 'APPROVED' },
            include: { requester: true }
        });

        const recentInvoices = await prisma.invoice.findMany({
            take: 5,
            orderBy: { date: 'desc' },
            include: { purchaseOrder: true }
        });

        // 5. Chart Data: Monthly Execution (Current Year)
        log('[Dashboard] 5. Fetching Chart Data...');
        // Using Prisma Client instead of raw query for better compatibility
        const startDate = new Date(currentYear, 0, 1);
        const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

        // Find all expense journal lines (Class 5) for the current year
        const expenseLines = await prisma.journalLine.findMany({
            where: {
                account: {
                    code: { startsWith: '5' }
                },
                journalEntry: {
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            },
            include: {
                journalEntry: true
            }
        });

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyTotals = new Array(12).fill(0);

        expenseLines.forEach(line => {
            const month = new Date(line.journalEntry.date).getMonth(); // 0-11
            monthlyTotals[month] += line.debit.toNumber();
        });

        const chartData = months.map((name, index) => ({
            name,
            executed: monthlyTotals[index]
        }));
        log('[Dashboard] 5. Done. Chart Data prepared.');

        // 6. Procurement KPIs
        log('[Dashboard] 6. Fetching Procurement KPIs...');
        const pendingOrders = await prisma.purchaseOrder.count({
            where: { status: { in: ['PENDING', 'PARTIAL'] } }
        });

        const totalInvoices = await prisma.invoice.count();
        const paidInvoices = await prisma.invoice.count({ where: { status: 'PAID' } });
        const unpaidInvoices = await prisma.invoice.count({ where: { status: 'UNPAID' } });

        res.json({
            bankAccounts,
            totalCash,
            procurement: {
                pendingOrders,
                totalInvoices,
                paidInvoices,
                unpaidInvoices
            },
            pendingInvoices: {
                count: pendingInvoicesCount,
                amount: pendingInvoicesTotal._sum.totalAmount?.toNumber() || 0
            },
            budget: {
                allocated: totalAllocated,
                committed: totalCommitted,
                executed: totalExecuted,
                percent: budgetExecutionPercent
            },
            recentActivity: {
                expenses: recentExpenses,
                invoices: recentInvoices
            },
            chartData
        });

    } catch (error: any) {
        log(`Error in getDashboardStats: ${error.message}\nStack: ${error.stack}`);
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};
