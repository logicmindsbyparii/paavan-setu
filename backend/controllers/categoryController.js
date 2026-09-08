const Category = require('../models/Category');

// GET /api/categories - Public: Get active categories
exports.getPublicCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort('order')
      .select('-__v');

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Admin Routes ─────────────────────────────────────────────────────────────

// GET /api/admin/categories
exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find()
      .sort('order')
      .select('-__v');

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/categories
exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/categories/:id
exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/categories/:id
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
