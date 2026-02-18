import { Router } from 'express';
import { getBudgetAccounts, createBudgetAccount, createBudgetTransaction } from '../controllers/budgetController';
import { authenticateToken } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticateToken);

// All users can view budget
router.get('/', getBudgetAccounts);

// Only ADMIN and ACCOUNTANT can create/modify budget
import { Role } from '@prisma/client';

// ... imports

// All users can view budget
router.get('/', getBudgetAccounts);

// Only ADMIN and ACCOUNTANT can create/modify budget
router.post('/', authorize([Role.ADMIN, Role.ACCOUNTANT]), createBudgetAccount);
router.post('/transaction', authorize([Role.ADMIN, Role.ACCOUNTANT]), createBudgetTransaction);

export default router;
