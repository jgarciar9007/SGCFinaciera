import { Router } from 'express';
import { createExpenseRequest, getExpenseRequests, updateExpenseStatus, uploadAttachment, deleteExpenseRequest, uploadQuotationAttachment } from '../controllers/expenseController';
import { authenticateToken } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticateToken); // Protect all expense routes

router.get('/', getExpenseRequests);
router.post('/', createExpenseRequest);

// Only ADMIN and DIRECTOR can approve/reject expenses
router.patch('/:id/status', authorize('ADMIN', 'DIRECTOR', 'ACCOUNTANT'), updateExpenseStatus);

// Only ADMIN can delete expenses
router.delete('/:id', authorize('ADMIN'), deleteExpenseRequest);

router.post('/:id/attachments', upload.single('file'), uploadAttachment);
router.post('/approval-document', upload.single('file'), (req, res, next) => {
    // Wrapper to match controller signature if needed, or just import
    const { uploadApprovalDoc } = require('../controllers/expenseController');
    uploadApprovalDoc(req, res);
});
router.post('/quotations/:id/attachment', upload.single('file'), uploadQuotationAttachment);

export default router;
