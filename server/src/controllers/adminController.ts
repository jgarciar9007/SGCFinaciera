import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';

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

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                createdAt: true
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id);

        if (isNaN(userId)) return res.status(400).json({ error: 'Invalid ID' });

        // Prevent deleting self (would need req.user from auth middleware, skipping for simplicity or assuming frontend handles warning)
        // Ideally: if (req.user.id === userId) return error;

        await prisma.user.delete({ where: { id: userId } });
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { email, password, fullName, role } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName,
                role: role || 'USER',
            },
        });

        res.status(201).json({ message: 'User created successfully', user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: 'Error creating user' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { email, fullName, role } = req.body;
        const userId = parseInt(id);

        if (isNaN(userId)) return res.status(400).json({ error: 'Invalid ID' });

        // Check if email is taken by another user
        if (email) {
            const existing = await prisma.user.findFirst({
                where: { email, NOT: { id: userId } }
            });
            if (existing) return res.status(400).json({ error: 'Email already in use' });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                email,
                fullName,
                role
            },
            select: { id: true, email: true, fullName: true, role: true }
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        const userId = parseInt(id);

        if (isNaN(userId)) return res.status(400).json({ error: 'Invalid ID' });
        if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset password' });
    }
};
