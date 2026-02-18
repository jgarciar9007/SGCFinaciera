import { Router } from 'express';
import { createPurchaseOrder, getPurchaseOrders, registerReception, getProcurementStats } from '../controllers/procurementController';
import { authenticateToken } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

const PURCHASERS = [Role.ADMIN, Role.ACCOUNTANT];
const VIEWERS = [Role.ADMIN, Role.ACCOUNTANT, Role.DIRECTOR, Role.MEMBER];

router.get('/stats', authorize(VIEWERS), getProcurementStats);
router.post('/', authorize(PURCHASERS), createPurchaseOrder);
router.get('/', authorize(VIEWERS), getPurchaseOrders);
router.post('/:id/reception', authorize(PURCHASERS), registerReception);

export default router;
