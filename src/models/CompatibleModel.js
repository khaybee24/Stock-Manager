const mongoose = require('mongoose');

const compatibleModelSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    brand: {
      type: String,
      required: true,
      trim: true,
    },

    model: {
      type: String,
      required: true,
      trim: true,
    },

    modelCode: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

compatibleModelSchema.index({
  model: 'text',
  brand: 'text',
  modelCode: 'text',
});

module.exports = mongoose.model(
  'CompatibleModel',
  compatibleModelSchema
);