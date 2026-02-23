import { Router } from 'express';
import { login, register, changePassword } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { loginSchema, changePasswordSchema } from '../validators/authValidators';

const router = Router();

router.post('/register', register); // If there is a register flow
router.post('/login', validate(loginSchema), login);

import { authenticateToken } from '../middleware/auth';
router.patch('/change-password', authenticateToken, validate(changePasswordSchema), changePassword);

export default router;
