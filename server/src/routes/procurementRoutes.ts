import { Router } from 'express';
import { createPurchaseOrder, getPurchaseOrders, registerReception } from '../controllers/procurementController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/', createPurchaseOrder);
router.get('/', getPurchaseOrders);
router.post('/:id/reception', registerReception);

export default router;
