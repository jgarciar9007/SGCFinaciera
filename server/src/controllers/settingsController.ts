import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Generic Helpers
// (Optional)

// --- ACCOUNTS (Plan de Cuentas) ---
export const getAccounts = async (req: Request, res: Response) => {
    try {
        const accounts = await prisma.account.findMany({
            orderBy: { code: 'asc' }
        });
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
};

export const createAccount = async (req: Request, res: Response) => {
    try {
        const account = await prisma.account.create({ data: req.body });
        res.json(account);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create account' });
    }
};

export const updateAccount = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const account = await prisma.account.update({
            where: { id: parseInt(id) },
            data: req.body
        });
        res.json(account);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update account' });
    }
};

export const deleteAccount = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.account.delete({ where: { id: parseInt(id) } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete account' });
    }
};

// --- THIRD PARTIES (Terceros) ---
export const getThirdParties = async (req: Request, res: Response) => {
    try {
        const items = await prisma.thirdParty.findMany({ orderBy: { name: 'asc' } });
        res.json(items);
    } catch (error) { res.status(500).json({ error: 'Error fetching data' }); }
};

export const createThirdParty = async (req: Request, res: Response) => {
    try {
        const item = await prisma.thirdParty.create({ data: req.body });
        res.json(item);
    } catch (error) { res.status(500).json({ error: 'Error creating item' }); }
};

export const updateThirdParty = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const item = await prisma.thirdParty.update({ where: { id: parseInt(id) }, data: req.body });
        res.json(item);
    } catch (error) { res.status(500).json({ error: 'Error updating item' }); }
};

export const deleteThirdParty = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.thirdParty.delete({ where: { id: parseInt(id) } });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Error deleting item' }); }
};

// --- PROGRAMS ---
export const getPrograms = async (req: Request, res: Response) => {
    try {
        const items = await prisma.program.findMany({ orderBy: { code: 'asc' } });
        res.json(items);
    } catch (error) { res.status(500).json({ error: 'Error fetching data' }); }
};

export const createProgram = async (req: Request, res: Response) => {
    try {
        const item = await prisma.program.create({ data: req.body });
        res.json(item);
    } catch (error) { res.status(500).json({ error: 'Error creating item' }); }
};

export const updateProgram = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const item = await prisma.program.update({ where: { id: parseInt(id) }, data: req.body });
        res.json(item);
    } catch (error) { res.status(500).json({ error: 'Error updating item' }); }
};

export const deleteProgram = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.program.delete({ where: { id: parseInt(id) } });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Error deleting item' }); }
};


// --- BANKS (Catalog) ---
export const getBanks = async (req: Request, res: Response) => {
    try {
        const items = await prisma.bank.findMany({ orderBy: { name: 'asc' } });
        res.json(items);
    } catch (error) { res.status(500).json({ error: 'Error fetching data' }); }
};

export const createBank = async (req: Request, res: Response) => {
    try {
        const item = await prisma.bank.create({ data: req.body });
        res.json(item);
    } catch (error) { res.status(500).json({ error: 'Error creating item' }); }
};

export const updateBank = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const item = await prisma.bank.update({ where: { id: parseInt(id) }, data: req.body });
        res.json(item);
    } catch (error) { res.status(500).json({ error: 'Error updating item' }); }
};

export const deleteBank = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.bank.delete({ where: { id: parseInt(id) } });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Error deleting item' }); }
};

// --- AREAS (Departamentos) ---
export const getAreas = async (req: Request, res: Response) => {
    try {
        const items = await prisma.area.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        res.json(items);
    } catch (error) { res.status(500).json({ error: 'Error fetching data' }); }
};

export const createArea = async (req: Request, res: Response) => {
    try {
        const item = await prisma.area.create({ data: req.body });
        res.json(item);
    } catch (error) { res.status(500).json({ error: 'Error creating item' }); }
};

export const updateArea = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const item = await prisma.area.update({ where: { id: parseInt(id) }, data: req.body });
        res.json(item);
    } catch (error) { res.status(500).json({ error: 'Error updating item' }); }
};

export const deleteArea = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.area.delete({ where: { id: parseInt(id) } });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Error deleting item' }); }
};
