import { Router } from 'express';
import {
    getAccounts, createAccount, updateAccount, deleteAccount,
    getThirdParties, createThirdParty, updateThirdParty, deleteThirdParty,
    getPrograms, createProgram, updateProgram, deleteProgram,
    getBanks, createBank, updateBank, deleteBank,
    getAreas, createArea, updateArea, deleteArea
} from '../controllers/settingsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// Accounts
router.get('/accounts', getAccounts);
router.post('/accounts', createAccount);
router.put('/accounts/:id', updateAccount);
router.delete('/accounts/:id', deleteAccount);

// Third Parties
router.get('/third-parties', getThirdParties);
router.post('/third-parties', createThirdParty);
router.put('/third-parties/:id', updateThirdParty);
router.delete('/third-parties/:id', deleteThirdParty);

// Programs
router.get('/programs', getPrograms);
router.post('/programs', createProgram);
router.put('/programs/:id', updateProgram);
router.delete('/programs/:id', deleteProgram);

// Banks
router.get('/banks', getBanks);
router.post('/banks', createBank);
router.put('/banks/:id', updateBank);
router.delete('/banks/:id', deleteBank);

// Areas
router.get('/areas', getAreas);
router.post('/areas', createArea);
router.put('/areas/:id', updateArea);
router.delete('/areas/:id', deleteArea);

export default router;
