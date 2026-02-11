import { Request, Response } from 'express';
import prisma from '../utils/prisma';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: number;
        role: string;
    };
}

// Get all assets with current assignment status
export const getAssets = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const assets = await prisma.asset.findMany({
            include: {
                movements: {
                    orderBy: { date: 'desc' },
                    take: 1, // Get latest movement to know current location/user
                    include: { user: true }
                },
                purchaseOrder: true,
                invoice: true
            },
            orderBy: { id: 'desc' }
        });
        res.json(assets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch assets' });
    }
};

// Create a movement (Assign, Return, etc.)
export const createMovement = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { assetId, type, assignedToUserId, areaId, notes, quantity } = req.body;

        const asset = await prisma.asset.findUnique({ where: { id: parseInt(assetId) } });
        if (!asset) return res.status(404).json({ error: 'Asset not found' });

        const movementQty = quantity ? parseInt(quantity) : 1;

        // Validate quantity for ASSIGNMENT and DISPOSAL
        if ((type === 'ASSIGNMENT' || type === 'DISPOSAL') && movementQty > asset.quantity) {
            return res.status(400).json({
                error: `Cantidad insuficiente. Disponible: ${asset.quantity}, Solicitado: ${movementQty}`
            });
        }

        const movement = await prisma.assetMovement.create({
            data: {
                assetId: parseInt(assetId),
                type,
                quantity: movementQty,
                assignedToUserId: assignedToUserId ? parseInt(assignedToUserId) : null,
                areaId: areaId ? parseInt(areaId) : null,
                notes,
                date: new Date()
            }
        });

        // Update asset quantity and location/status based on movement
        let newLocation = asset.location;
        let newStatus = asset.status;
        let quantityChange = 0;

        if (type === 'ASSIGNMENT') {
            const parts = [];

            if (areaId) {
                const area = await prisma.area.findUnique({ where: { id: parseInt(areaId) } });
                if (area) parts.push(area.name);
            }

            if (assignedToUserId) {
                const user = await prisma.user.findUnique({ where: { id: parseInt(assignedToUserId) } });
                if (user) parts.push(`Responsable: ${user.fullName}`);
            }

            if (parts.length > 0) {
                newLocation = parts.join(' - ');
            }

            newStatus = 'IN_USE';
            quantityChange = -movementQty;
        } else if (type === 'RETURN') {
            newLocation = 'Bodega Central';
            newStatus = 'ACTIVE';
            quantityChange = movementQty;
        } else if (type === 'DISPOSAL') {
            newStatus = 'DISPOSED';
            quantityChange = -movementQty;
        }

        await prisma.asset.update({
            where: { id: parseInt(assetId) },
            data: {
                location: newLocation,
                status: newStatus,
                quantity: { increment: quantityChange }
            }
        });

        res.json(movement);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create movement' });
    }
};

// Get movements history for an asset
export const getAssetMovements = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const movements = await prisma.assetMovement.findMany({
            where: { assetId: parseInt(id) },
            include: {
                user: true,
                area: true
            },
            orderBy: { date: 'desc' }
        });
        res.json(movements);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};
