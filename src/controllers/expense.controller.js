const Expense = require('../models/Expense');

// Create expense
exports.createExpense = async (req, res) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      user: req.user._id,
    });

    res.status(201).json({
      message: 'Expense created successfully',
      expense,
    });
  } catch (error) {
    console.error('Create expense error:', error);

    res.status(400).json({
      message: error.message,
    });
  }
};

// Get all expenses
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user._id })
      .sort({ date: -1 });

    res.status(200).json({
      expenses,
    });
  } catch (error) {
    console.error('Get expenses error:', error);

    res.status(500).json({
      message: 'Failed to fetch expenses',
    });
  }
};