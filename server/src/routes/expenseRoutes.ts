import { Router } from 'express';
import { createExpenseRequest, getExpenseRequests, updateExpenseStatus, uploadAttachment, deleteExpenseRequest, uploadQuotationAttachment } from '../controllers/expenseController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticateToken); // Protect all expense routes

router.get('/', getExpenseRequests);
router.post('/', createExpenseRequest);
router.delete('/:id', deleteExpenseRequest);
router.patch('/:id/status', updateExpenseStatus);
router.post('/:id/attachments', upload.single('file'), uploadAttachment);
router.post('/quotations/:id/attachment', upload.single('file'), uploadQuotationAttachment);

export default router;
