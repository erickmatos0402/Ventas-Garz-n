import { Router } from 'express';
import * as authController from '../controllers/auth.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getCurrentUser);
router.put('/profile', authMiddleware, authController.updateProfile);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

export default router;
