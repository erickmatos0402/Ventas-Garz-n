import { Router } from 'express';
import * as orderController from '../controllers/order.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/', authMiddleware, orderController.createOrderHandler);
router.get('/', authMiddleware, orderController.listOrders);
router.get('/:id', authMiddleware, orderController.getOrderHandler);
router.patch('/:id/status', authMiddleware, adminMiddleware, orderController.updateOrderStatusHandler);

export default router;
