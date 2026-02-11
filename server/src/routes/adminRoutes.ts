import { Router } from 'express';
import { clearData, getUsers, deleteUser, createUser, updateUser, resetPassword } from '../controllers/adminController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRole(['ADMIN']));

router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.patch('/users/:id/reset-password', resetPassword);
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.post('/clear-data', clearData);

export default router;
