import { Router } from 'express';
import { login, register, changePassword } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);

import { authenticateToken } from '../middleware/auth';
router.patch('/change-password', authenticateToken, changePassword);

export default router;
