import { z } from 'zod';

// Asset Schemas
export const createAssetSchema = z.object({
    code: z.string().optional(),
    name: z.string().min(1, 'El nombre es requerido').max(255),
    description: z.string().optional(),
    purchaseDate: z.string().datetime('Fecha de compra inválida'),
    unitValue: z.number().positive('El valor unitario debe ser positivo'),
    quantity: z.number().int().positive('La cantidad debe ser un número positivo').default(1),
    location: z.string().optional(),
    status: z.enum(['ACTIVE', 'DISPOSED', 'DEPRECIATED', 'IN_USE']).default('ACTIVE'),
    purchaseOrderId: z.number().int().positive().optional(),
    invoiceId: z.number().int().positive().optional()
});

export const updateAssetSchema = z.object({
    code: z.string().optional(),
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    purchaseDate: z.string().datetime().optional(),
    unitValue: z.number().positive().optional(),
    quantity: z.number().int().positive().optional(),
    location: z.string().optional(),
    status: z.enum(['ACTIVE', 'DISPOSED', 'DEPRECIATED', 'IN_USE']).optional()
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
