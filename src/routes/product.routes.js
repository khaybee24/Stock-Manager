const express = require('express');

const router = express.Router();

const productController = require('../controllers/product.controller');

// Search compatible phone models
router.get(
  '/compatible/search',
  productController.getCompatibleModels
);

// Create product
router.post('/', productController.createProduct);

// Get all products / search products
router.get('/', productController.getProducts);

// Get one product
router.get('/:id', productController.getProduct);

// Update product
router.put('/:id', productController.updateProduct);
router.patch('/:id', productController.updateProduct);

// Delete product
router.delete('/:id', productController.deleteProduct);

// Add compatible phone model
router.post(
  '/:id/compatible-models',
  productController.addCompatibleModel
);

module.exports = router;