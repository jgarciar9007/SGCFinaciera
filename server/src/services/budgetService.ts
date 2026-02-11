import prisma from '../utils/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export class BudgetService {
    /**
     * Calculate budget status for a specific budget account
     */
    async calculateBudgetStatus(budgetAccountId: number) {
        const account = await prisma.budgetAccount.findUnique({
            where: { id: budgetAccountId },
            include: {
                transactions: true,
                expenseRequests: {
                    where: {
                        status: { in: ['SUBMITTED', 'APPROVED', 'COMPLETED'] }
                    }
                }
            }
        });

        if (!account) {
            throw new Error('Budget account not found');
        }

        // Calculate committed (SUBMITTED expenses)
        const committed = account.expenseRequests
            .filter(e => e.status === 'SUBMITTED')
            .reduce((sum, e) => sum + Number(e.totalAmount), 0);

        // Calculate executed (APPROVED and COMPLETED expenses)
        const executed = account.expenseRequests
            .filter(e => e.status === 'APPROVED' || e.status === 'COMPLETED')
            .reduce((sum, e) => sum + Number(e.totalAmount), 0);

        const allocated = Number(account.allocatedAmount);
        const available = allocated - committed - executed;

        return {
            allocated,
            committed,
            executed,
            available,
            executionPercentage: allocated > 0 ? Math.round((executed / allocated) * 100) : 0,
            commitmentPercentage: allocated > 0 ? Math.round((committed / allocated) * 100) : 0
        };
    }

    /**
     * Get all budget accounts with calculated status
     */
    async getBudgetAccountsWithStatus(year?: number) {
        const currentYear = year || new Date().getFullYear();

        const accounts = await prisma.budgetAccount.findMany({
            where: { year: currentYear },
            include: {
                account: true,
                transactions: true,
                expenseRequests: {
                    where: {
                        status: { in: ['SUBMITTED', 'APPROVED', 'COMPLETED'] }
                    }
                }
            },
            orderBy: { code: 'asc' }
        });

        return Promise.all(
            accounts.map(async (account) => {
                const status = await this.calculateBudgetStatus(account.id);
                return {
                    ...account,
                    ...status
                };
            })
        );
    }

    /**
     * Check if budget has sufficient funds
     */
    async checkBudgetAvailability(budgetAccountId: number, amount: number): Promise<boolean> {
        const status = await this.calculateBudgetStatus(budgetAccountId);
        return status.available >= amount;
    }

    /**
     * Get budget summary for dashboard
     */
    async getBudgetSummary(year?: number) {
        const currentYear = year || new Date().getFullYear();

        const accounts = await this.getBudgetAccountsWithStatus(currentYear);

        const summary = accounts.reduce((acc, account) => {
            return {
                totalAllocated: acc.totalAllocated + account.allocated,
                totalCommitted: acc.totalCommitted + account.committed,
                totalExecuted: acc.totalExecuted + account.executed,
                totalAvailable: acc.totalAvailable + account.available
            };
        }, {
            totalAllocated: 0,
            totalCommitted: 0,
            totalExecuted: 0,
            totalAvailable: 0
        });

        return {
            ...summary,
            executionPercentage: summary.totalAllocated > 0
                ? Math.round((summary.totalExecuted / summary.totalAllocated) * 100)
                : 0,
            accountCount: accounts.length
        };
    }
}

export const budgetService = new BudgetService();
