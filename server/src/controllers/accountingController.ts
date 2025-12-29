import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// --- JOURNAL ENTRIES ---

export const getJournalEntries = async (req: Request, res: Response) => {
    try {
        const entries = await prisma.journalEntry.findMany({
            include: {
                lines: {
                    include: { account: true }
                }
            },
            orderBy: { date: 'desc' }
        });
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching journal entries' });
    }
};

export const createJournalEntry = async (req: Request, res: Response) => {
    try {
        const { date, description, reference, lines } = req.body;

        // Validation: Debits must equal Credits
        const totalDebit = lines.reduce((sum: number, line: any) => sum + Number(line.debit || 0), 0);
        const totalCredit = lines.reduce((sum: number, line: any) => sum + Number(line.credit || 0), 0);

        // Allow small floating point difference? For now, strict check.
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return res.status(400).json({ error: `Unbalanced entry. Debit: ${totalDebit}, Credit: ${totalCredit}` });
        }

        const entry = await prisma.journalEntry.create({
            data: {
                date: new Date(date),
                description,
                reference,
                status: 'POSTED',
                lines: {
                    create: lines.map((line: any) => ({
                        accountId: Number(line.accountId),
                        debit: line.debit,
                        credit: line.credit,
                        description: line.description,
                        thirdPartyId: line.thirdPartyId ? parseInt(line.thirdPartyId) : undefined
                    }))
                }
            },
            include: { lines: true }
        });
        res.json(entry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating journal entry' });
    }
};

export const getJournalEntry = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const entry = await prisma.journalEntry.findUnique({
            where: { id: parseInt(id) },
            include: { lines: { include: { account: true } } }
        });
        if (!entry) return res.status(404).json({ error: 'Entry not found' });
        res.json(entry);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching entry' });
    }
};

// --- REPORTS ---

export const getTrialBalance = async (req: Request, res: Response) => {
    try {
        // Aggregate all lines by account
        const lines = await prisma.journalLine.groupBy({
            by: ['accountId'],
            _sum: {
                debit: true,
                credit: true
            }
        });

        // Enrich with Account details
        const result = [];
        for (const line of lines) {
            const account = await prisma.account.findUnique({ where: { id: line.accountId } });
            if (account) {
                result.push({
                    accountId: line.accountId,
                    code: account.code,
                    name: account.name,
                    debit: line._sum.debit || 0,
                    credit: line._sum.credit || 0,
                    balance: (Number(line._sum.debit) - Number(line._sum.credit))
                    // TODO: Balance direction depends on Account Nature (Active/Expense -> Debit positive, Passive/Income -> Credit positive)
                });
            }
        }


        // Sort by code
        result.sort((a, b) => a.code.localeCompare(b.code));
        res.json(result);

    } catch (error) {
        res.status(500).json({ error: 'Error generating Trial Balance' });
    }
};

export const getThirdPartyLedger = async (req: Request, res: Response) => {
    try {
        // Aggregate lines by account AND thirdParty
        const lines = await prisma.journalLine.groupBy({
            by: ['accountId', 'thirdPartyId'],
            _sum: {
                debit: true,
                credit: true
            }
        });

        const result = [];

        for (const line of lines) {
            if (!line.thirdPartyId) continue; // Skip entries without third party

            const account = await prisma.account.findUnique({ where: { id: line.accountId } });
            const thirdParty = await prisma.thirdParty.findUnique({ where: { id: line.thirdPartyId } });

            if (account && thirdParty) {
                result.push({
                    accountCode: account.code,
                    accountName: account.name,
                    thirdPartyName: thirdParty.name,
                    debit: line._sum.debit || 0,
                    credit: line._sum.credit || 0,
                    balance: Number(line._sum.debit) - Number(line._sum.credit)
                });
            }
        }

        // Sort by Third Party Name then Account Code
        result.sort((a, b) => {
            const cmp = a.thirdPartyName.localeCompare(b.thirdPartyName);
            if (cmp !== 0) return cmp;
            return a.accountCode.localeCompare(b.accountCode);
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error generating Third Party Ledger' });
    }
};
