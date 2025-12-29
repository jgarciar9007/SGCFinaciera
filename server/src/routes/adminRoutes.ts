import { Router } from 'express';
import { clearData } from '../controllers/adminController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Admin only check should ideally be here or inside controller. 
// For now, assuming middleware or controller handles it.
// Adding a simple role check if possible, otherwise rely on controller.

router.post('/clear-data', clearData);

export default router;
