import { Router } from 'express';
import { authenticateToken as auth } from '../middleware/auth';
import {
    createInvoice,
    getInvoices,
    createPayment,
    getPayments,
    uploadInvoiceAttachment,
    payInvoice // NUEVO
} from '../controllers/billingController';
import multer from 'multer';
import path from 'path';

import { authorize } from '../middleware/authorize';
import { Role } from '@prisma/client';

const router = Router();

// Multer config for invoice uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'invoice-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Roles
const INVOICE_MANAGERS = [Role.ADMIN, Role.ACCOUNTANT];
const PAYMENT_MANAGERS = [Role.ADMIN, Role.TREASURER];
const VIEWERS = [Role.ADMIN, Role.ACCOUNTANT, Role.TREASURER, Role.DIRECTOR, Role.MEMBER];

// Invoices
router.post('/invoices', auth, authorize(INVOICE_MANAGERS), createInvoice);
router.get('/invoices', auth, authorize(VIEWERS), getInvoices);
router.post('/invoices/upload', auth, authorize(INVOICE_MANAGERS), upload.single('file'), uploadInvoiceAttachment);

// Payments
router.post('/payments', auth, authorize(PAYMENT_MANAGERS), createPayment);
router.get('/payments', auth, authorize(VIEWERS), getPayments);

// NEW: Pay Invoice
router.post('/invoices/:id/pay', auth, authorize(PAYMENT_MANAGERS), payInvoice);

export default router;
