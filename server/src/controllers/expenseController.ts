import { Request, Response } from 'express';
import prisma from '../utils/prisma';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: number;
        role: string;
    };
}

export const createExpenseRequest = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { description, totalAmount, items, budgetAccountId, quotations, status } = req.body;
        const requesterId = req.user?.userId;

        if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });

        // Default to SUBMITTED if not specified for backward compatibility, though UI will send DRAFT
        const finalStatus = status === 'DRAFT' ? 'DRAFT' : 'SUBMITTED';

        const expense = await prisma.expenseRequest.create({
            data: {
                requesterId,
                description,
                totalAmount: parseFloat(totalAmount),
                status: finalStatus,
                budgetAccountId: budgetAccountId ? parseInt(budgetAccountId) : undefined,
                items: {
                    create: items.map((item: any) => ({
                        description: item.description,
                        quantity: parseInt(item.quantity),
                        unitPrice: parseFloat(item.unitPrice),
                        totalPrice: parseInt(item.quantity) * parseFloat(item.unitPrice)
                    }))
                },
                quotations: quotations ? {
                    create: quotations.map((q: any) => ({
                        supplierName: q.supplierName,
                        amount: parseFloat(q.amount),
                        filePath: q.filePath // Optional attachment path
                    }))
                } : undefined
            },
            include: { items: true, quotations: true }
        });

        res.json(expense);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create expense request' });
    }
};

export const deleteExpenseRequest = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        const expense = await prisma.expenseRequest.findUnique({
            where: { id: parseInt(id) }
        });

        if (!expense) {
            return res.status(404).json({ error: 'Expense request not found' });
        }

        // Only owner or Admin should delete? For now, requester check is good.
        // Assuming Admin can force delete drafts too.
        if (expense.requesterId !== userId && req.user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (expense.status !== 'DRAFT') {
            return res.status(400).json({ error: 'Solo se pueden eliminar solicitudes en estado Borrador.' });
        }

        // Transactional Delete
        await prisma.$transaction(async (tx) => {
            await tx.expenseItem.deleteMany({ where: { expenseRequestId: expense.id } });
            await tx.expenseAttachment.deleteMany({ where: { expenseRequestId: expense.id } });
            await tx.expenseQuotation.deleteMany({ where: { expenseRequestId: expense.id } });
            await tx.expenseRequest.delete({ where: { id: expense.id } });
        });

        res.json({ message: 'Solicitud eliminada correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete expense request' });
    }
};

export const getExpenseRequests = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role;
        console.log(`[DEBUG Expense] UserID: ${userId}, Role: ${role}`);

        const whereClause: any = {};

        if (role === 'USER') {
            whereClause.requesterId = userId;
        }

        const expenses = await prisma.expenseRequest.findMany({
            where: whereClause,
            include: {
                requester: { select: { fullName: true, email: true } },
                items: true,
                attachments: true,
                quotations: true,
                purchaseOrder: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(expenses);
    } catch (error) {
        console.error('[DEBUG Expense Error]:', error);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
};

export const updateExpenseStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status, selectedQuotationId } = req.body;
        const approverId = req.user?.userId;
        const role = req.user?.role;

        if (role !== 'ADMIN' && role !== 'DIRECTOR') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        // Transaction to handle Status + Quotation Selection + PO Creation
        const result = await prisma.$transaction(async (tx) => {
            const expense = await tx.expenseRequest.update({
                where: { id: parseInt(id) },
                data: {
                    status,
                    approverId: status === 'APPROVED' || status === 'REJECTED' ? approverId : undefined
                },
                include: { quotations: true }
            });

            if (status === 'APPROVED' && selectedQuotationId) {
                // 1. Mark Quotation as Selected
                await tx.expenseQuotation.update({
                    where: { id: parseInt(selectedQuotationId) },
                    data: { isSelected: true }
                });

                // 2. Find selected quotation details
                const selectedQ = expense.quotations.find(q => q.id === parseInt(selectedQuotationId));
                if (selectedQ) {
                    // 3. Create Purchase Orderautomatically
                    await tx.purchaseOrder.create({
                        data: {
                            expenseRequestId: expense.id,
                            supplierName: selectedQ.supplierName,
                            totalAmount: selectedQ.amount,
                            status: 'ISSUED'
                        }
                    });
                }
            } else if (status === 'APPROVED' && !selectedQuotationId && expense.quotations.length > 0) {
                // Check if there are quotations but none selected? Policy decision.
                // For now, allow approval without selection if explicit logic not strictly enforced, 
                // BUT the user asked for this flow.
                // We will assume if no ID sent, no PO created automagically or manual PO later.
            }

            return expense;
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update expense status' });
    }
};

// ... existing code ...

export const uploadAttachment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const file = req.file;

        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        const attachment = await prisma.expenseAttachment.create({
            data: {
                expenseRequestId: parseInt(id),
                fileName: file.originalname,
                filePath: `/uploads/${file.filename}`
            }
        });

        res.json(attachment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload attachment' });
    }
};

export const uploadQuotationAttachment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const file = req.file;

        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        const quotation = await prisma.expenseQuotation.update({
            where: { id: parseInt(id) },
            data: {
                filePath: `/uploads/${file.filename}`
            }
        });

        res.json(quotation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upload quotation attachment' });
    }
};
