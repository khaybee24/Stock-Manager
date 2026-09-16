const Product = require('../models/Product');
const CompatibleModel = require('../models/CompatibleModel');

// Create product
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create({
      ...req.body,
      user: req.user._id,
    });

    res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    console.error('Create product error:', error);

    res.status(400).json({
      message: error.message,
    });
  }
};

// Get all products / search products
exports.getProducts = async (req, res) => {
  try {
    const search = req.query.q?.trim();

    let filter = { user: req.user._id };

    if (search) {
      const regex = new RegExp(search, 'i');

      filter = {
        user: req.user._id,
        $or: [
          { screenCode: regex },
          { name: regex },
          { brand: regex },
        ],
      };
    }

    const products = await Product.find(filter)
      .sort({ screenCode: 1 });

    res.status(200).json({
      products,
    });
  } catch (error) {
    console.error('Get products error:', error);

    res.status(500).json({
      message: 'Failed to fetch products',
    });
  }
};

// Get one product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    res.status(200).json({
      product,
    });
  } catch (error) {
    console.error('Get product error:', error);

    res.status(400).json({
      message: 'Invalid product ID',
    });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { user, ...updates } = req.body;
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    res.status(200).json({
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    console.error('Update product error:', error);

    res.status(400).json({
      message: error.message,
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    res.status(200).json({
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);

    res.status(400).json({
      message: 'Invalid product ID',
    });
  }
};

// Add compatible phone model
exports.addCompatibleModel = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    const compatibleModel = await CompatibleModel.create({
      ...req.body,
      product: req.params.id,
      user: req.user._id,
    });

    res.status(201).json({
      message: 'Compatible model added successfully',
      compatibleModel,
    });
  } catch (error) {
    console.error('Add compatible model error:', error);

    res.status(400).json({
      message: error.message,
    });
  }
};

// Search compatible phone models
exports.getCompatibleModels = async (req, res) => {
  try {
    const search = req.query.model?.trim();

    if (!search) {
      return res.status(400).json({
        message: 'model is required',
      });
    }

    const regex = new RegExp(search, 'i');

    const compatibleModels = await CompatibleModel.find({
      user: req.user._id,
      $or: [
        { model: regex },
        { modelCode: regex },
        { brand: regex },
      ],
    }).populate('product');

    res.status(200).json({
      compatibleModels,
    });
  } catch (error) {
    console.error('Get compatible models error:', error);

    res.status(500).json({
      message: 'Failed to fetch compatible models',
    });
  }
};