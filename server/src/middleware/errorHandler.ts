import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Log error for debugging
    console.error('[Error Handler]:', {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

    // Handle known AppError instances
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: err.message,
            code: err.code,
            details: err instanceof ValidationError ? err.details : undefined
        });
    }

    // Handle Prisma errors
    if (err.name === 'PrismaClientKnownRequestError') {
        const prismaError = err as any;

        if (prismaError.code === 'P2002') {
            return res.status(409).json({
                error: 'Ya existe un registro con estos datos',
                code: 'DUPLICATE_ENTRY'
            });
        }

        if (prismaError.code === 'P2025') {
            return res.status(404).json({
                error: 'Registro no encontrado',
                code: 'NOT_FOUND'
            });
        }
    }

    // Default error response
    res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
    });
};
