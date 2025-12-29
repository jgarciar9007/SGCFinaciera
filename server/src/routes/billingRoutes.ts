import { Router } from 'express';
import { createInvoice, getInvoices, createPayment, getPayments, uploadInvoiceAttachment } from '../controllers/billingController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticateToken);

// Invoices
router.post('/invoices/upload', upload.single('file'), uploadInvoiceAttachment);
router.post('/invoices', createInvoice);
router.get('/invoices', getInvoices);

// Payments
router.post('/payments', createPayment);
router.get('/payments', getPayments);

export default router;
