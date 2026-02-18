import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { Role } from '@prisma/client';

export const authorize = (allowedRoles: Role[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            throw new UnauthorizedError();
        }

        if (!allowedRoles.includes(req.user.role)) {
            // ADMIN has access to everything? Maybe not by default, usually explicit.
            // But if we want ADMIN to be superuser, we can check here.
            if (req.user.role === Role.ADMIN) {
                return next();
            }
            throw new ForbiddenError();
        }

        next();
    };
};
