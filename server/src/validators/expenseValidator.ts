import { z } from 'zod';

// Expense Request Schemas
export const expenseItemSchema = z.object({
    description: z.string().min(1, 'La descripción es requerida'),
    quantity: z.number().int().positive('La cantidad debe ser positiva'),
    unitPrice: z.number().positive('El precio unitario debe ser positivo'),
    totalPrice: z.number().positive('El precio total debe ser positivo')
});

export const expenseQuotationSchema = z.object({
    supplierName: z.string().min(1, 'El nombre del proveedor es requerido'),
    amount: z.number().positive('El monto debe ser positivo'),
    filePath: z.string().optional(),
    isSelected: z.boolean().default(false)
});

export const createExpenseRequestSchema = z.object({
    description: z.string().min(1, 'La descripción es requerida'),
    totalAmount: z.number().positive('El monto total debe ser positivo'),
    budgetAccountId: z.number().int().positive().optional(),
    items: z.array(expenseItemSchema).min(1, 'Debe incluir al menos un ítem'),
    quotations: z.array(expenseQuotationSchema).optional().default([]),
    status: z.enum(['DRAFT', 'SUBMITTED']).default('DRAFT')
});

export const updateExpenseStatusSchema = z.object({
    status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'COMPLETED']),
    approverId: z.number().int().positive().optional()
});

export type CreateExpenseRequestInput = z.infer<typeof createExpenseRequestSchema>;
export type UpdateExpenseStatusInput = z.infer<typeof updateExpenseStatusSchema>;
