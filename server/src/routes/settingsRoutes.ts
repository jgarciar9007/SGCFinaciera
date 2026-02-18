import { Router } from 'express';
import {
    getAccounts, createAccount, updateAccount, deleteAccount,
    getThirdParties, createThirdParty, updateThirdParty, deleteThirdParty,
    getPrograms, createProgram, updateProgram, deleteProgram,
    getBanks, createBank, updateBank, deleteBank,
    getAreas, createArea, updateArea, deleteArea
} from '../controllers/settingsController';
import { authenticateToken } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { Role } from '@prisma/client';

const router = Router();
router.use(authenticateToken);

const ADMIN_ONLY = [Role.ADMIN];
const VIEWERS = [Role.ADMIN, Role.DIRECTOR, Role.ACCOUNTANT, Role.MEMBER, Role.TREASURER];

// Accounts
router.get('/accounts', authorize(VIEWERS), getAccounts);
router.post('/accounts', authorize(ADMIN_ONLY), createAccount);
router.put('/accounts/:id', authorize(ADMIN_ONLY), updateAccount);
router.delete('/accounts/:id', authorize(ADMIN_ONLY), deleteAccount);

// Third Parties
router.get('/third-parties', authorize(VIEWERS), getThirdParties);
router.post('/third-parties', authorize(ADMIN_ONLY), createThirdParty);
router.put('/third-parties/:id', authorize(ADMIN_ONLY), updateThirdParty);
router.delete('/third-parties/:id', authorize(ADMIN_ONLY), deleteThirdParty);

// Programs
router.get('/programs', authorize(VIEWERS), getPrograms);
router.post('/programs', authorize(ADMIN_ONLY), createProgram);
router.put('/programs/:id', authorize(ADMIN_ONLY), updateProgram);
router.delete('/programs/:id', authorize(ADMIN_ONLY), deleteProgram);

// Banks
router.get('/banks', authorize(VIEWERS), getBanks);
router.post('/banks', authorize(ADMIN_ONLY), createBank);
router.put('/banks/:id', authorize(ADMIN_ONLY), updateBank);
router.delete('/banks/:id', authorize(ADMIN_ONLY), deleteBank);

// Areas
router.get('/areas', authorize(VIEWERS), getAreas);
router.post('/areas', authorize(ADMIN_ONLY), createArea);
router.put('/areas/:id', authorize(ADMIN_ONLY), updateArea);
router.delete('/areas/:id', authorize(ADMIN_ONLY), deleteArea);

export default router;
