import { Router } from 'express';
import {
    getBankAccounts, createBankAccount, deleteBankAccount,
    createTransaction, getTransactions, conciliatePayment
} from '../controllers/treasuryController';

const router = Router();
// Accounts
router.get('/accounts', getBankAccounts);
router.post('/accounts', createBankAccount);
router.delete('/accounts/:id', deleteBankAccount);
router.post('/transactions', createTransaction);
router.get('/accounts/:id/transactions', getTransactions);
router.post('/payments/:id/conciliate', conciliatePayment);

export default router;
