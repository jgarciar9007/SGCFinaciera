import { Router } from 'express';
import { getJournalEntries, createJournalEntry, getJournalEntry, getTrialBalance, getThirdPartyLedger } from '../controllers/accountingController';

import { authenticateToken } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

const VIEWERS = [Role.ADMIN, Role.DIRECTOR, Role.ACCOUNTANT, Role.MEMBER, Role.TREASURER];
const EDITORS = [Role.ADMIN, Role.ACCOUNTANT];

// Journal Entries
router.get('/entries', authorize(VIEWERS), getJournalEntries);
router.post('/entries', authorize(EDITORS), createJournalEntry);
router.get('/entries/:id', authorize(VIEWERS), getJournalEntry);

// Reports
router.get('/trial-balance', authorize(VIEWERS), getTrialBalance);
router.get('/third-party-ledger', authorize(VIEWERS), getThirdPartyLedger);

export default router;
