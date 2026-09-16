const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');

exports.getDashboard = async (req, res) => {
  try {
    // Start of today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Start of tomorrow
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const [
      products,
      sales,
      expenses,
      lowStockProducts,
    ] = await Promise.all([
      // All active products
      Product.find({ isActive: true, user: req.user._id }),

      // Today's completed sales
      Sale.find({
        user: req.user._id,
        createdAt: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
        status: 'completed',
      }),

      // Today's expenses
      Expense.find({
        user: req.user._id,
        date: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      }),

      // Products that have reached their reorder level
      Product.find({
        isActive: true,
        user: req.user._id,
        $expr: {
          $lte: ['$quantity', '$reorderLevel'],
        },
      }).sort({ quantity: 1 }),
    ]);

    // Total value of current inventory
    const stockValue = products.reduce(
      (total, product) =>
        total + product.quantity * product.averageCost,
      0
    );

    // Today's revenue
    const revenue = sales.reduce(
      (total, sale) => total + sale.grandTotal,
      0
    );

    // Today's gross profit
    const grossProfit = sales.reduce(
      (total, sale) => {
        const saleProfit = sale.items.reduce(
          (itemTotal, item) => itemTotal + item.profit,
          0
        );

        return total + saleProfit;
      },
      0
    );

    // Today's expenses
    const totalExpenses = expenses.reduce(
      (total, expense) => total + expense.amount,
      0
    );

    // Net profit
    const netProfit = grossProfit - totalExpenses;

    // Total units currently in stock
    const totalUnits = products.reduce(
      (total, product) => total + product.quantity,
      0
    );

    res.json({
      stockValue,

      today: {
        sales: revenue,
        grossProfit,
        expenses: totalExpenses,
        netProfit,
      },

      inventory: {
        totalProducts: products.length,
        totalUnits,
        lowStock: lowStockProducts.length,
      },

      products,
      lowStock: lowStockProducts,
    });
  } catch (error) {
    console.error('Dashboard error:', error);

    res.status(500).json({
      message: 'Failed to load dashboard',
    });
  }
};