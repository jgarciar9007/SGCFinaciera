import { z } from 'zod';

const RoleEnum = z.enum(['ADMIN', 'USER', 'MEMBER', 'DIRECTOR', 'ACCOUNTANT', 'TREASURER']);

export const createUserSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        fullName: z.string().min(3, 'Full name must be at least 3 characters long'),
        role: RoleEnum.default('USER'),
        password: z.string().min(6, 'Password must be at least 6 characters long')
    })
});

export const updateUserSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format').optional(),
        fullName: z.string().min(3, 'Full name must be at least 3 characters long').optional(),
        role: RoleEnum.optional()
    })
});

export const resetPasswordSchema = z.object({
    body: z.object({
        password: z.string().min(6, 'Password must be at least 6 characters long')
    }),
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID must be an integer')
    })
});
