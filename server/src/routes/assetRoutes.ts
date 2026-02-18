
import { Router } from 'express';
import { getAssets, createAsset, updateAsset, deleteAsset } from '../controllers/assetController';
import { authenticateToken } from '../middleware/auth';

import { authorize } from '../middleware/authorize';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

const EDITORS = [Role.ADMIN, Role.ACCOUNTANT];

router.get('/', getAssets); // All authenticated users can view assets? Or restrict? Let's allow all for now.
router.post('/', authorize(EDITORS), createAsset);
router.put('/:id', authorize(EDITORS), updateAsset);
router.delete('/:id', authorize([Role.ADMIN]), deleteAsset);

export default router;
