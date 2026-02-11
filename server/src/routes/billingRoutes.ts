import { Router } from 'express';
import { createInvoice, getInvoices, createPayment, getPayments, uploadInvoiceAttachment } from '../controllers/billingController';
import { authenticateToken } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticateToken);

// Invoices - Only ADMIN and ACCOUNTANT can create
router.post('/invoices/upload', authorize('ADMIN', 'ACCOUNTANT'), upload.single('file'), uploadInvoiceAttachment);
router.post('/invoices', authorize('ADMIN', 'ACCOUNTANT'), createInvoice);
router.get('/invoices', getInvoices);

// Payments - Only ADMIN and ACCOUNTANT can create payments
router.post('/payments', authorize('ADMIN', 'ACCOUNTANT'), createPayment);
router.get('/payments', getPayments);

export default router;
