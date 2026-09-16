const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    screenCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    brand: {
      type: String,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        'screen',
        'phone',
        'battery',
        'charger',
        'accessory',
        'other',
      ],
      default: 'screen',
    },

    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    reorderLevel: {
      type: Number,
      default: 2,
      min: 0,
    },

    averageCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    sellingPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ user: 1, screenCode: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);