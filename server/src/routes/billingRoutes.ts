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

// Invoices
router.post('/invoices', auth, createInvoice);
router.get('/invoices', auth, getInvoices);
router.post('/invoices/upload', auth, upload.single('file'), uploadInvoiceAttachment);

// Payments
router.post('/payments', auth, createPayment);
router.get('/payments', auth, getPayments);

// NEW: Pay Invoice with Bank Account Selection
router.post('/invoices/:id/pay', auth, payInvoice);

export default router;
