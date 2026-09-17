const mongoose = require('mongoose');

const dailySummarySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
    },

    sales: {
      type: Number,
      default: 0,
    },

    grossProfit: {
      type: Number,
      default: 0,
    },

    expenses: {
      type: Number,
      default: 0,
    },

    netProfit: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// One summary per user per day
dailySummarySchema.index(
  { user: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model('DailySummary', dailySummarySchema);