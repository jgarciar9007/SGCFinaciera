import { Router } from 'express';
import { getJournalEntries, createJournalEntry, getJournalEntry, getTrialBalance, getThirdPartyLedger } from '../controllers/accountingController';

const router = Router();

// Journal Entries
router.get('/entries', getJournalEntries);
router.post('/entries', createJournalEntry);
router.get('/entries/:id', getJournalEntry);

// Reports
router.get('/trial-balance', getTrialBalance);
router.get('/third-party-ledger', getThirdPartyLedger);

export default router;
