import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';

const router = Router();

router.get('/products', ProductController.getAllProducts);
router.get('/products/:id', ProductController.getProductById);
router.post('/products', ProductController.createProduct);
router.put('/products/:id', ProductController.updateProduct);
router.delete('/products/:id', ProductController.deleteProduct);

router.post('/products/upload', ProductController.uploadProductImage);
router.put('/products/:id/images', ProductController.updateProductImages);

export default router;
