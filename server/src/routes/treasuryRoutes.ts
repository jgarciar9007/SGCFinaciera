import { Router } from 'express';
import {
    getBankAccounts, createBankAccount, deleteBankAccount,
    createTransaction, getTransactions, conciliatePayment
} from '../controllers/treasuryController';
import { authenticateToken } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { Role } from '@prisma/client';

const router = Router();
router.use(authenticateToken);

const TREASURERS = [Role.ADMIN, Role.TREASURER];
const VIEWERS = [Role.ADMIN, Role.TREASURER, Role.ACCOUNTANT, Role.DIRECTOR, Role.MEMBER];

// Accounts
router.get('/accounts', authorize(VIEWERS), getBankAccounts);
router.post('/accounts', authorize([Role.ADMIN]), createBankAccount); // Only Admin creates bank accounts? Or Treasurer? Let's say Admin.
router.delete('/accounts/:id', authorize([Role.ADMIN]), deleteBankAccount);

router.post('/transactions', authorize(TREASURERS), createTransaction);
router.get('/accounts/:id/transactions', authorize(VIEWERS), getTransactions);
router.post('/payments/:id/conciliate', authorize(TREASURERS), conciliatePayment);

export default router;
