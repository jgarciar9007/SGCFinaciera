import { Router } from 'express';
import { getBudgetAccounts, createBudgetAccount, createBudgetTransaction } from '../controllers/budgetController';
import { authenticateToken } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticateToken);

// All users can view budget
router.get('/', getBudgetAccounts);

// Only ADMIN and ACCOUNTANT can create/modify budget
router.post('/', authorize('ADMIN', 'ACCOUNTANT'), createBudgetAccount);
router.post('/transaction', authorize('ADMIN', 'ACCOUNTANT'), createBudgetTransaction);

export default router;
