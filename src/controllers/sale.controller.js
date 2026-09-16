const Sale = require('../models/Sale');
const Product = require('../models/Product');

const {
  changeStock,
} = require('../services/inventory.service');

const {
  makeInvoice,
} = require('../utils/invoice');

// Create sale
exports.createSale = async (req, res) => {
  try {
    const inputItems = req.body.items || [];

    if (!inputItems.length) {
      throw new Error('At least one item is required');
    }

    const items = [];
    let subtotal = 0;

    for (const inputItem of inputItems) {
      const product = await Product.findOne({
        _id: inputItem.product,
        user: req.user._id,
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const quantity = Number(inputItem.quantity);

      const unitPrice = Number(
        inputItem.unitPrice ?? product.sellingPrice
      );

      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
      ) {
        throw new Error('Invalid sale item');
      }

      // Check available stock
      if (product.quantity < quantity) {
        throw new Error(
          `Insufficient stock for ${product.screenCode}`
        );
      }

      const total = quantity * unitPrice;

        /*
         * Snapshot the current average cost.
         * This is important because the product's averageCost
         * may change after this sale.
         */
      const costPrice = product.averageCost;

      const profit =
        quantity * (unitPrice - costPrice);

      items.push({
        product: product._id,
        quantity,
        unitPrice,
        costPrice,
        total,
        profit,
      });

      subtotal += total;
    }

      // Validate discount
    const discount = Number(req.body.discount || 0);

    if (
      !Number.isFinite(discount) ||
      discount < 0 ||
      discount > subtotal
    ) {
      throw new Error('Invalid discount');
    }

    const grandTotal = subtotal - discount;

      /*
       * Create the sale first.
       */
    const sale = await Sale.create({
      user: req.user._id,
      invoiceNumber: makeInvoice('SAL'),
      items,
      subtotal,
      discount,
      grandTotal,
      paymentMethod: req.body.paymentMethod || 'cash',
      note: req.body.note,
    });

      /*
       * Reduce stock.
       */
    for (const item of items) {
      const product = await Product.findOne({
        _id: item.product,
        user: req.user._id,
      });

      await changeStock({
        product,
        delta: -item.quantity,
        type: 'sale',
        reference: sale._id,
        user: req.user._id,
      });
    }

    res.status(201).json({
      message: 'Sale created successfully',
      sale,
    });
  } catch (error) {
    console.error('Create sale error:', error);

    res.status(400).json({
      message: error.message,
    });
  }
};

// Get all sales
exports.getSales = async (req, res) => {
  try {
    const filter = { user: req.user._id };
    const { from, to } = req.query;

    if (from) {
      const startDate = new Date(`${from}T00:00:00.000Z`);

      if (Number.isNaN(startDate.getTime())) {
        return res.status(400).json({ message: 'Invalid start date' });
      }

      filter.createdAt = { $gte: startDate };
    }

    if (to) {
      const endDate = new Date(`${to}T00:00:00.000Z`);

      if (Number.isNaN(endDate.getTime())) {
        return res.status(400).json({ message: 'Invalid end date' });
      }

      endDate.setUTCDate(endDate.getUTCDate() + 1);
      filter.createdAt = {
        ...(filter.createdAt || {}),
        $lt: endDate,
      };
    }

    const sales = await Sale.find(filter)
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.status(200).json({
      sales,
    });
  } catch (error) {
    console.error('Get sales error:', error);

    res.status(500).json({
      message: 'Failed to fetch sales',
    });
  }
};