import prisma from '../utils/prisma';
import { NotFoundError, ValidationError } from '../utils/errors';

export class ExpenseService {
    /**
     * Get expense request with full details
     */
    async getExpenseById(id: number) {
        const expense = await prisma.expenseRequest.findUnique({
            where: { id },
            include: {
                requester: {
                    select: { id: true, fullName: true, email: true }
                },
                approver: {
                    select: { id: true, fullName: true, email: true }
                },
                budgetAccount: true,
                items: true,
                quotations: true,
                attachments: true,
                purchaseOrder: true
            }
        });

        if (!expense) {
            throw new NotFoundError('Solicitud de gasto');
        }

        return expense;
    }

    /**
     * Calculate total from items
     */
    calculateTotal(items: Array<{ quantity: number; unitPrice: number }>) {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    }

    /**
     * Validate expense request before approval
     */
    async validateForApproval(expenseId: number) {
        const expense = await this.getExpenseById(expenseId);

        // Check if already approved/rejected
        if (expense.status !== 'SUBMITTED') {
            throw new ValidationError('Solo se pueden aprobar solicitudes en estado SUBMITTED');
        }

        // Check if has items
        if (expense.items.length === 0) {
            throw new ValidationError('La solicitud debe tener al menos un ítem');
        }

        // Check budget availability if linked
        if (expense.budgetAccountId) {
            const { budgetService } = await import('./budgetService');
            const hasAvailability = await budgetService.checkBudgetAvailability(
                expense.budgetAccountId,
                Number(expense.totalAmount)
            );

            if (!hasAvailability) {
                throw new ValidationError('Presupuesto insuficiente para aprobar esta solicitud');
            }
        }

        return true;
    }

    /**
     * Approve expense request
     */
    async approveExpense(expenseId: number, approverId: number) {
        await this.validateForApproval(expenseId);

        return prisma.expenseRequest.update({
            where: { id: expenseId },
            data: {
                status: 'APPROVED',
                approverId
            },
            include: {
                requester: true,
                budgetAccount: true,
                items: true
            }
        });
    }

    /**
     * Reject expense request
     */
    async rejectExpense(expenseId: number, approverId: number) {
        const expense = await this.getExpenseById(expenseId);

        if (expense.status !== 'SUBMITTED') {
            throw new ValidationError('Solo se pueden rechazar solicitudes en estado SUBMITTED');
        }

        return prisma.expenseRequest.update({
            where: { id: expenseId },
            data: {
                status: 'REJECTED',
                approverId
            }
        });
    }

    /**
     * Get expense statistics
     */
    async getExpenseStats(userId?: number) {
        const where = userId ? { requesterId: userId } : {};

        const [total, submitted, approved, rejected, completed] = await Promise.all([
            prisma.expenseRequest.count({ where }),
            prisma.expenseRequest.count({ where: { ...where, status: 'SUBMITTED' } }),
            prisma.expenseRequest.count({ where: { ...where, status: 'APPROVED' } }),
            prisma.expenseRequest.count({ where: { ...where, status: 'REJECTED' } }),
            prisma.expenseRequest.count({ where: { ...where, status: 'COMPLETED' } })
        ]);

        return {
            total,
            submitted,
            approved,
            rejected,
            completed,
            draft: total - submitted - approved - rejected - completed
        };
    }
}

export const expenseService = new ExpenseService();
