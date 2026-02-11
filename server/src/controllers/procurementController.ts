import { Request, Response } from 'express';
import prisma from '../utils/prisma';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: number;
        role: string;
    };
}

export const createPurchaseOrder = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { expenseRequestId, supplierName, supplierTaxId } = req.body;

        // Check if expense exists and is approved
        const expense = await prisma.expenseRequest.findUnique({
            where: { id: expenseRequestId }
        });

        if (!expense) {
            return res.status(404).json({ error: 'Expense request not found' });
        }

        if (expense.status !== 'APPROVED') {
            return res.status(400).json({ error: 'Expense request must be APPROVED to generate a PO' });
        }

        // Check if PO already exists
        const existingPO = await prisma.purchaseOrder.findUnique({
            where: { expenseRequestId }
        });

        if (existingPO) {
            return res.status(400).json({ error: 'Purchase Order already exists for this expense' });
        }

        const po = await prisma.purchaseOrder.create({
            data: {
                expenseRequestId,
                supplierName,
                supplierTaxId,
                totalAmount: expense.totalAmount
            }
        });

        res.json(po);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create Purchase Order' });
    }
};

export const getPurchaseOrders = async (req: AuthenticatedRequest, res: Response) => {
    try {
        console.log(`[DEBUG PO] Fetching Purchase Orders... UserID: ${req.user?.userId}`);
        const pos = await prisma.purchaseOrder.findMany({
            include: {
                expenseRequest: {
                    include: { items: true }
                },
                receptions: true,
                invoices: true
            },
            orderBy: { date: 'desc' }
        });

        res.json(pos);
    } catch (error) {
        console.error('[DEBUG PO Error]:', error);
        res.status(500).json({ error: 'Failed to fetch Purchase Orders' });
    }
};

export const registerReception = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params; // PO ID
        const { note } = req.body;

        const poId = parseInt(id);
        const po = await prisma.purchaseOrder.findUnique({
            where: { id: poId },
            include: {
                expenseRequest: {
                    include: { items: true }
                }
            }
        });

        if (!po) return res.status(404).json({ error: 'Purchase Order not found' });

        // Create reception
        const reception = await prisma.reception.create({
            data: {
                purchaseOrderId: poId,
                note
            }
        });

        // Update PO status
        await prisma.purchaseOrder.update({
            where: { id: poId },
            data: { status: 'RECEIVED' }
        });

        // Auto-create or update Assets from Expense Items (Quantity-based)
        if (po.expenseRequest && po.expenseRequest.items.length > 0) {
            for (const item of po.expenseRequest.items) {
                // Check if asset with same name and PO already exists
                const existingAsset = await prisma.asset.findFirst({
                    where: {
                        name: item.description,
                        purchaseOrderId: po.id
                    }
                });

                let asset;
                if (existingAsset) {
                    // Update existing asset quantity
                    asset = await prisma.asset.update({
                        where: { id: existingAsset.id },
                        data: {
                            quantity: { increment: item.quantity }
                        }
                    });
                } else {
                    // Create new asset with quantity
                    asset = await prisma.asset.create({
                        data: {
                            name: item.description,
                            description: `Recibido desde OC #${po.id}`,
                            code: `AST-${po.id}-${item.id}`, // Optional reference
                            purchaseOrderId: po.id,
                            unitValue: item.unitPrice,
                            quantity: item.quantity,
                            status: 'ACTIVE',
                            location: 'Bodega Central',
                            purchaseDate: po.date
                        }
                    });
                }

                // Log reception movement
                await prisma.assetMovement.create({
                    data: {
                        assetId: asset.id,
                        type: 'RECEPTION',
                        quantity: item.quantity,
                        notes: `Recepción desde OC #${po.id}`
                    }
                });
            }
        }

        res.json(reception);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to register reception' });
    }
};
