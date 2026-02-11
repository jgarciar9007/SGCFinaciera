import { z } from 'zod';

// Invoice Schemas
export const createInvoiceSchema = z.object({
    purchaseOrderId: z.number().int().positive().optional(),
    number: z.string().min(1, 'El número de factura es requerido'),
    supplierName: z.string().min(1, 'El nombre del proveedor es requerido'),
    date: z.string().datetime('Fecha inválida'),
    dueDate: z.string().datetime('Fecha de vencimiento inválida').optional(),
    totalAmount: z.number().positive('El monto total debe ser positivo'),
    attachmentPath: z.string().optional()
});

export const updateInvoiceSchema = z.object({
    number: z.string().min(1).optional(),
    supplierName: z.string().min(1).optional(),
    date: z.string().datetime().optional(),
    dueDate: z.string().datetime().optional(),
    totalAmount: z.number().positive().optional(),
    status: z.enum(['UNPAID', 'PARTIAL', 'PAID']).optional(),
    attachmentPath: z.string().optional()
});

// Payment Schemas
export const createPaymentSchema = z.object({
    invoiceId: z.number().int().positive('ID de factura inválido'),
    bankAccountId: z.number().int().positive('ID de cuenta bancaria inválido').optional(),
    amount: z.number().positive('El monto debe ser positivo'),
    date: z.string().datetime('Fecha inválida').optional(),
    reference: z.string().optional()
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
