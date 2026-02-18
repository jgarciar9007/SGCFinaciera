import { Router } from 'express';
import { getAssets, createMovement, getAssetMovements } from '../controllers/inventoryController';
import { authenticateToken } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

const MOVERS = [Role.ADMIN, Role.ACCOUNTANT];

router.get('/assets', getAssets);
router.post('/movements', authorize(MOVERS), createMovement);
router.get('/assets/:id/movements', getAssetMovements);

export default router;
