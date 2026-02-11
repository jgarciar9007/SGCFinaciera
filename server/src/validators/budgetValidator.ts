import { z } from 'zod';

// Budget Account Schemas
export const createBudgetAccountSchema = z.object({
    accountId: z.number().int().positive().optional(),
    code: z.string().min(1, 'El código es requerido'),
    name: z.string().min(1, 'El nombre es requerido'),
    year: z.number().int().min(2000).max(2100, 'Año inválido'),
    allocatedAmount: z.number().nonnegative('El monto asignado debe ser mayor o igual a cero').default(0)
});

export const updateBudgetAccountSchema = z.object({
    accountId: z.number().int().positive().optional(),
    code: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    year: z.number().int().min(2000).max(2100).optional(),
    allocatedAmount: z.number().nonnegative().optional()
});

export type CreateBudgetAccountInput = z.infer<typeof createBudgetAccountSchema>;
export type UpdateBudgetAccountInput = z.infer<typeof updateBudgetAccountSchema>;
