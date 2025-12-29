
import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAssets = async (req: Request, res: Response) => {
    try {
        const assets = await prisma.asset.findMany({
            include: {
                purchaseOrder: true,
                invoice: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(assets);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch assets' });
    }
};

export const createAsset = async (req: Request, res: Response) => {
    try {
        const { code, name, description, purchaseDate, value, location, status, purchaseOrderId, invoiceId } = req.body;

        const asset = await prisma.asset.create({
            data: {
                code,
                name,
                description,
                purchaseDate: new Date(purchaseDate),
                value,
                location,
                status,
                purchaseOrderId,
                invoiceId
            }
        });

        res.json(asset);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create asset' });
    }
};

export const updateAsset = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { code, name, description, purchaseDate, value, location, status } = req.body;

        const asset = await prisma.asset.update({
            where: { id: parseInt(id) },
            data: {
                code,
                name,
                description,
                purchaseDate: new Date(purchaseDate),
                value,
                location,
                status
            }
        });

        res.json(asset);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update asset' });
    }
};

export const deleteAsset = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.asset.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Asset deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete asset' });
    }
};
