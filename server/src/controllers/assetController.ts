import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest, PaginationParams, PaginatedResponse } from '../types';
import { createAssetSchema, updateAssetSchema } from '../validators/assetValidator';
import { ValidationError, NotFoundError } from '../utils/errors';
import { z } from 'zod';

export const getAssets = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // Pagination
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        const [assets, total] = await Promise.all([
            prisma.asset.findMany({
                skip,
                take: limit,
                include: {
                    purchaseOrder: true,
                    invoice: true
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.asset.count()
        ]);

        const response: PaginatedResponse<typeof assets[0]> = {
            data: assets,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };

        res.json(response);
    } catch (error) {
        next(error);
    }
};

export const createAsset = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // Validate input
        const validatedData = createAssetSchema.parse(req.body);

        const asset = await prisma.asset.create({
            data: {
                ...validatedData,
                purchaseDate: new Date(validatedData.purchaseDate)
            },
            include: {
                purchaseOrder: true,
                invoice: true
            }
        });

        res.status(201).json(asset);
    } catch (error) {
        if (error instanceof z.ZodError) {
            next(new ValidationError('Datos inválidos', error.issues));
        } else {
            next(error);
        }
    }
};

export const updateAsset = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const assetId = parseInt(id);

        if (isNaN(assetId)) {
            throw new ValidationError('ID de activo inválido');
        }

        // Validate input
        const validatedData = updateAssetSchema.parse(req.body);

        // Check if asset exists
        const existingAsset = await prisma.asset.findUnique({
            where: { id: assetId }
        });

        if (!existingAsset) {
            throw new NotFoundError('Activo');
        }

        const asset = await prisma.asset.update({
            where: { id: assetId },
            data: {
                ...validatedData,
                purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : undefined
            },
            include: {
                purchaseOrder: true,
                invoice: true
            }
        });

        res.json(asset);
    } catch (error) {
        if (error instanceof z.ZodError) {
            next(new ValidationError('Datos inválidos', error.issues));
        } else {
            next(error);
        }
    }
};

export const deleteAsset = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const assetId = parseInt(id);

        if (isNaN(assetId)) {
            throw new ValidationError('ID de activo inválido');
        }

        // Check if asset exists
        const existingAsset = await prisma.asset.findUnique({
            where: { id: assetId }
        });

        if (!existingAsset) {
            throw new NotFoundError('Activo');
        }

        await prisma.asset.delete({
            where: { id: assetId }
        });

        res.json({ message: 'Activo eliminado exitosamente' });
    } catch (error) {
        next(error);
    }
};
