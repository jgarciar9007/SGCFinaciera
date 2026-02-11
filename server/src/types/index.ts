import { Request } from 'express';

// Authenticated Request
export interface AuthenticatedRequest extends Request {
    user: {
        userId: number;
        role: string;
    };
}

// Pagination
export interface PaginationParams {
    page: number;
    limit: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Upload Request
export interface UploadRequest extends Request {
    file?: Express.Multer.File;
    user?: {
        userId: number;
        role: string;
    };
}

// API Response
export interface ApiError {
    error: string;
    code?: string;
    details?: any;
}

export interface ApiSuccess<T = any> {
    message?: string;
    data?: T;
}
