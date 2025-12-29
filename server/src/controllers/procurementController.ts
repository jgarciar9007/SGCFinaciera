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

        const po = await prisma.purchaseOrder.findUnique({ where: { id: parseInt(id) } });

        if (!po) return res.status(404).json({ error: 'Purchase Order not found' });

        // Create reception
        const reception = await prisma.reception.create({
            data: {
                purchaseOrderId: parseInt(id),
                note
            }
        });

        // Update PO status
        await prisma.purchaseOrder.update({
            where: { id: parseInt(id) },
            data: { status: 'RECEIVED' }
        });

        // Update Expense status to COMPLETED if needed, or keep distinct? 
        // Let's keep Expense as APPROVED (since it was the request) and PO handles the fulfillment lifecycle.

        res.json(reception);
    } catch (error) {
        res.status(500).json({ error: 'Failed to register reception' });
    }
};
