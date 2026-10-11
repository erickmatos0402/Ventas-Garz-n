import { Router } from 'express';
import * as adminController from '../controllers/admin.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard', authMiddleware, adminMiddleware, adminController.getDashboard);
router.get('/products', authMiddleware, adminMiddleware, adminController.listAllProducts);
router.get('/orders', authMiddleware, adminMiddleware, adminController.listAllOrders);
router.get('/users', authMiddleware, adminMiddleware, adminController.listAllUsers);
router.get('/analytics/sales', authMiddleware, adminMiddleware, adminController.getSalesAnalytics);

router.get('/market', authMiddleware, adminMiddleware, adminController.listSectionProducts);
router.post('/market', authMiddleware, adminMiddleware, adminController.createSectionProduct);
router.put('/market/:id', authMiddleware, adminMiddleware, adminController.updateSectionProduct);
router.delete('/market/:id', authMiddleware, adminMiddleware, adminController.deleteSectionProduct);

router.get('/boutique', authMiddleware, adminMiddleware, adminController.listSectionProducts);
router.post('/boutique', authMiddleware, adminMiddleware, adminController.createSectionProduct);
router.put('/boutique/:id', authMiddleware, adminMiddleware, adminController.updateSectionProduct);
router.delete('/boutique/:id', authMiddleware, adminMiddleware, adminController.deleteSectionProduct);

export default router;
