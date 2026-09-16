const Purchase = require('../models/Purchase');
const Product = require('../models/Product');

const { changeStock } = require('../services/inventory.service');
const { makeInvoice } = require('../utils/invoice');

exports.createPurchase = async (req, res) => {
  try {
    const inputItems = req.body.items || [];

    if (!inputItems.length) {
      throw new Error('At least one item is required');
    }

    const items = [];
    let grandTotal = 0;

    for (const inputItem of inputItems) {
      const product = await Product.findOne({
        _id: inputItem.product,
        user: req.user._id,
      });

      if (!product) {
        throw new Error('Product not found');
      }

        const quantity = Number(inputItem.quantity);
        const unitCost = Number(inputItem.unitCost);

        if (
          !Number.isInteger(quantity) ||
          quantity < 1 ||
          !Number.isFinite(unitCost) ||
          unitCost < 0
        ) {
          throw new Error('Invalid purchase item');
        }

        const totalCost = quantity * unitCost;

        // Calculate weighted average cost
        const currentStockValue =
          product.quantity * product.averageCost;

        const incomingStockValue =
          quantity * unitCost;

        const newQuantity =
          product.quantity + quantity;

        const newAverageCost =
          newQuantity > 0
            ? (currentStockValue + incomingStockValue) /
              newQuantity
            : 0;

        product.averageCost = newAverageCost;

        // Save cost update
        await product.save();

        items.push({
          product: product._id,
          quantity,
          unitCost,
          totalCost,
        });

        grandTotal += totalCost;
      }

      // Create purchase record
    const purchase = await Purchase.create({
      user: req.user._id,
      invoiceNumber: makeInvoice('PUR'),
      supplier: req.body.supplier,
      items,
      grandTotal,
      note: req.body.note,
    });

      // Increase stock and create stock movements
    for (const item of items) {
      const product = await Product.findOne({
        _id: item.product,
        user: req.user._id,
      });

      await changeStock({
        product,
        delta: item.quantity,
        type: 'purchase',
        reference: purchase._id,
        user: req.user._id,
      });
    }

    res.status(201).json({
      message: 'Purchase created successfully',
      purchase,
    });
  } catch (error) {
    console.error('Create purchase error:', error);

    res.status(400).json({
      message: error.message,
    });
  }
};

exports.getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find({ user: req.user._id })
      .populate('supplier')
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.status(200).json({
      purchases,
    });
  } catch (error) {
    console.error('Get purchases error:', error);

    res.status(500).json({
      message: 'Failed to fetch purchases',
    });
  }
};