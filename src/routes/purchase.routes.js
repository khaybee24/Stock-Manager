const express = require('express');

const router = express.Router();

const purchaseController = require('../controllers/purchase.controller');

// Create purchase
router.post('/', purchaseController.createPurchase);

// Get all purchases
router.get('/', purchaseController.getPurchases);

module.exports = router;