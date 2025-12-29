
import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Starting debug...');
        const currentYear = new Date().getFullYear();

        // 1. Bank Summary
        console.log('Fetching Banks...');
        const bankAccounts = await prisma.bankAccount.findMany();
        console.log('Banks:', bankAccounts.length);

        // 2. Pending Invoices
        console.log('Fetching Invoices...');
        const pendingInvoicesTotal = await prisma.invoice.aggregate({
            _sum: { totalAmount: true },
            where: { status: { not: 'PAID' } }
        });
        console.log('Pending Invoices Amount:', pendingInvoicesTotal._sum.totalAmount?.toString());

        // 3. Budget
        console.log('Fetching Budget...');
        // Mock budget logic
        const budgetAccounts = await prisma.budgetAccount.findMany({ where: { year: currentYear } });
        console.log('Budget Accounts:', budgetAccounts.length);

        // 4. Monthly Execution (The suspected part)
        console.log('Fetching Monthly Execution...');
        const startDate = new Date(currentYear, 0, 1);
        const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

        const expenseLines = await prisma.journalLine.findMany({
            where: {
                account: { code: { startsWith: '6' } },
                journalEntry: { date: { gte: startDate, lte: endDate } }
            },
            include: { journalEntry: true }
        });
        console.log('Expense Lines found:', expenseLines.length);

        const monthlyTotals = new Array(12).fill(0);
        expenseLines.forEach(line => {
            const month = new Date(line.journalEntry.date).getMonth();
            monthlyTotals[month] += line.debit.toNumber();
        });
        console.log('Monthly Totals:', monthlyTotals);

        // 5. Recent Activity
        console.log('Fetching Recent Activity...');
        const recentExpenses = await prisma.expenseRequest.findMany({ take: 5 });
        console.log('Recent Expenses:', recentExpenses.length);

        console.log('SUCCESS');

    } catch (e) {
        console.error('ERROR CAUGHT:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
