import { Router } from 'express';
import {
    getBankAccounts, createBankAccount, deleteBankAccount, // Add import
    createTransaction, getTransactions
} from '../controllers/treasuryController';

const router = Router();
// Accounts
router.get('/accounts', getBankAccounts);
router.post('/accounts', createBankAccount);
router.delete('/accounts/:id', deleteBankAccount); // Add this
router.post('/transactions', createTransaction);
router.get('/accounts/:id/transactions', getTransactions);

export default router;
