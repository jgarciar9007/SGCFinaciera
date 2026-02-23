import { Router } from 'express';
import { clearData, getUsers, deleteUser, createUser, updateUser, resetPassword } from '../controllers/adminController';
import { authenticateToken } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { Role } from '@prisma/client';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema, resetPasswordSchema } from '../validators/userValidators';

const router = Router();

router.use(authenticateToken);
router.use(authorize([Role.ADMIN]));

router.post('/users', validate(createUserSchema), createUser);
router.put('/users/:id', validate(updateUserSchema), updateUser);
router.patch('/users/:id/reset-password', validate(resetPasswordSchema), resetPassword);
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.post('/clear-data', clearData);

export default router;
