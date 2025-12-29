import { Router } from 'express';
import { getBudgetAccounts, createBudgetAccount, createBudgetTransaction } from '../controllers/budgetController';

const router = Router();

router.get('/', getBudgetAccounts);
router.post('/', createBudgetAccount);
router.post('/transaction', createBudgetTransaction);

export default router;
