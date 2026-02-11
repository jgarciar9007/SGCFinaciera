import { Router } from 'express';
import { getAssets, createMovement, getAssetMovements } from '../controllers/inventoryController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/assets', getAssets);
router.post('/movements', createMovement);
router.get('/assets/:id/movements', getAssetMovements);

export default router;
