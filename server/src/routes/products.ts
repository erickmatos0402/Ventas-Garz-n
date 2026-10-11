import { Router } from 'express';
import * as productController from '../controllers/product.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', productController.listProducts);
router.get('/search', productController.searchProductsHandler);
router.get('/:id', productController.getProduct);

// Admin routes
router.post('/', authMiddleware, adminMiddleware, productController.createProductHandler);
router.put('/:id', authMiddleware, adminMiddleware, productController.updateProductHandler);
router.delete('/:id', authMiddleware, adminMiddleware, productController.deleteProductHandler);

export default router;
