const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const DailySummary = require('../models/DailySummary');

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
      Product.find({
        isActive: true,
        user: req.user._id,
      }),

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

      // Low stock products
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

    // Save today's summary
    await DailySummary.findOneAndUpdate(
      {
        user: req.user._id,
        date: startOfDay,
      },
      {
        sales: revenue,
        grossProfit,
        expenses: totalExpenses,
        netProfit,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

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



exports.getDailyHistory = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {
      user: req.user._id,
    };

    let start;
    let end;

    // Validate startDate
    if (startDate) {
      start = new Date(startDate);

      if (isNaN(start.getTime())) {
        return res.status(400).json({
          message: 'Invalid startDate',
        });
      }

      start.setHours(0, 0, 0, 0);
    }

    // Validate endDate
    if (endDate) {
      end = new Date(endDate);

      if (isNaN(end.getTime())) {
        return res.status(400).json({
          message: 'Invalid endDate',
        });
      }

      end.setHours(23, 59, 59, 999);
    }

    // Make sure startDate is not after endDate
    if (start && end && start > end) {
      return res.status(400).json({
        message: 'startDate cannot be greater than endDate',
      });
    }

    // Apply date filters
    if (start || end) {
      filter.date = {};

      if (start) {
        filter.date.$gte = start;
      }

      if (end) {
        filter.date.$lte = end;
      }
    }

    // Fetch daily records and calculate totals
    // at the same time
    const [daily, totalsResult] = await Promise.all([
      DailySummary.find(filter)
        .sort({ date: -1 })
        .lean(),

      DailySummary.aggregate([
        {
          $match: filter,
        },

        {
          $group: {
            _id: null,

            sales: {
              $sum: '$sales',
            },

            grossProfit: {
              $sum: '$grossProfit',
            },

            expenses: {
              $sum: '$expenses',
            },

            netProfit: {
              $sum: '$netProfit',
            },
          },
        },

        {
          $project: {
            _id: 0,
            sales: 1,
            grossProfit: 1,
            expenses: 1,
            netProfit: 1,
          },
        },
      ]),
    ]);

    // If there are no records, return zero totals
    const totals = totalsResult[0] || {
      sales: 0,
      grossProfit: 0,
      expenses: 0,
      netProfit: 0,
    };

    res.json({
      count: daily.length,

      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },

      totals,

      daily,
    });
  } catch (error) {
    console.error('Daily history error:', error);

    res.status(500).json({
      message: 'Failed to load daily history',
    });
  }
};
