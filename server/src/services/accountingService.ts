import prisma from '../utils/prisma';

export class AccountingService {
    /**
     * Calculate balance for an account based on its nature
     * ACTIVE/EXPENSE accounts: Debit increases, Credit decreases
     * PASSIVE/INCOME accounts: Credit increases, Debit decreases
     */
    calculateAccountBalance(
        nature: 'ACTIVE' | 'PASSIVE' | 'EXPENSE' | 'INCOME',
        debitTotal: number,
        creditTotal: number
    ): number {
        if (nature === 'ACTIVE' || nature === 'EXPENSE') {
            // Debit positive
            return debitTotal - creditTotal;
        } else {
            // Credit positive (PASSIVE or INCOME)
            return creditTotal - debitTotal;
        }
    }

    /**
     * Get account balance with transactions
     */
    async getAccountBalance(accountId: number) {
        const account = await prisma.account.findUnique({
            where: { id: accountId },
            include: {
                journalEntries: true
            }
        });

        if (!account) {
            throw new Error('Account not found');
        }

        const debitTotal = account.journalEntries
            .filter(e => e.type === 'DEBIT')
            .reduce((sum, e) => sum + Number(e.amount), 0);

        const creditTotal = account.journalEntries
            .filter(e => e.type === 'CREDIT')
            .reduce((sum, e) => sum + Number(e.amount), 0);

        const balance = this.calculateAccountBalance(
            account.nature,
            debitTotal,
            creditTotal
        );

        return {
            account,
            debitTotal,
            creditTotal,
            balance,
            nature: account.nature
        };
    }

    /**
     * Get trial balance (all accounts with balances)
     */
    async getTrialBalance(year?: number) {
        const currentYear = year || new Date().getFullYear();

        const accounts = await prisma.account.findMany({
            include: {
                journalEntries: {
                    where: {
                        date: {
                            gte: new Date(`${currentYear}-01-01`),
                            lte: new Date(`${currentYear}-12-31`)
                        }
                    }
                }
            },
            orderBy: { code: 'asc' }
        });

        const balances = accounts.map(account => {
            const debitTotal = account.journalEntries
                .filter(e => e.type === 'DEBIT')
                .reduce((sum, e) => sum + Number(e.amount), 0);

            const creditTotal = account.journalEntries
                .filter(e => e.type === 'CREDIT')
                .reduce((sum, e) => sum + Number(e.amount), 0);

            const balance = this.calculateAccountBalance(
                account.nature,
                debitTotal,
                creditTotal
            );

            return {
                accountId: account.id,
                code: account.code,
                name: account.name,
                nature: account.nature,
                debitTotal,
                creditTotal,
                balance
            };
        });

        // Calculate totals
        const totals = balances.reduce((acc, item) => ({
            debitTotal: acc.debitTotal + item.debitTotal,
            creditTotal: acc.creditTotal + item.creditTotal
        }), { debitTotal: 0, creditTotal: 0 });

        return {
            balances,
            totals,
            isBalanced: Math.abs(totals.debitTotal - totals.creditTotal) < 0.01
        };
    }

    /**
     * Create journal entry (double-entry bookkeeping)
     */
    async createJournalEntry(data: {
        date: Date;
        description: string;
        entries: Array<{
            accountId: number;
            type: 'DEBIT' | 'CREDIT';
            amount: number;
        }>;
    }) {
        // Validate double-entry
        const debitSum = data.entries
            .filter(e => e.type === 'DEBIT')
            .reduce((sum, e) => sum + e.amount, 0);

        const creditSum = data.entries
            .filter(e => e.type === 'CREDIT')
            .reduce((sum, e) => sum + e.amount, 0);

        if (Math.abs(debitSum - creditSum) > 0.01) {
            throw new Error('Journal entry must balance: debits must equal credits');
        }

        // Create entries in transaction
        return prisma.$transaction(
            data.entries.map(entry =>
                prisma.journalEntry.create({
                    data: {
                        accountId: entry.accountId,
                        type: entry.type,
                        amount: entry.amount,
                        date: data.date,
                        description: data.description
                    }
                })
            )
        );
    }

    /**
     * Get financial statements summary
     */
    async getFinancialSummary(year?: number) {
        const trialBalance = await this.getTrialBalance(year);

        const assets = trialBalance.balances
            .filter(b => b.nature === 'ACTIVE' && b.balance > 0)
            .reduce((sum, b) => sum + b.balance, 0);

        const liabilities = trialBalance.balances
            .filter(b => b.nature === 'PASSIVE' && b.balance > 0)
            .reduce((sum, b) => sum + b.balance, 0);

        const income = trialBalance.balances
            .filter(b => b.nature === 'INCOME' && b.balance > 0)
            .reduce((sum, b) => sum + b.balance, 0);

        const expenses = trialBalance.balances
            .filter(b => b.nature === 'EXPENSE' && b.balance > 0)
            .reduce((sum, b) => sum + b.balance, 0);

        const equity = assets - liabilities;
        const netIncome = income - expenses;

        return {
            balanceSheet: {
                assets,
                liabilities,
                equity
            },
            incomeStatement: {
                income,
                expenses,
                netIncome
            },
            isBalanced: trialBalance.isBalanced
        };
    }
}

export const accountingService = new AccountingService();
