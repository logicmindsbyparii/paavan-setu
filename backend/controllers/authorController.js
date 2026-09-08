const Author = require('../models/Author');

// GET /api/authors - Public: Get active authors
exports.getPublicAuthors = async (req, res, next) => {
  try {
    const authors = await Author.find({ isActive: true })
      .sort('order')
      .select('-__v');

    res.json({
      success: true,
      data: authors,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Admin Routes ─────────────────────────────────────────────────────────────

// GET /api/admin/authors
exports.getAllAuthors = async (req, res, next) => {
  try {
    const authors = await Author.find()
      .sort('order')
      .select('-__v');

    res.json({
      success: true,
      data: authors,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/authors
exports.createAuthor = async (req, res, next) => {
  try {
    const author = await Author.create(req.body);

    res.status(201).json({
      success: true,
      data: author,
      message: 'Author created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/authors/:id
exports.updateAuthor = async (req, res, next) => {
  try {
    const author = await Author.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found',
      });
    }

    res.json({
      success: true,
      data: author,
      message: 'Author updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/authors/:id
exports.deleteAuthor = async (req, res, next) => {
  try {
    const author = await Author.findByIdAndDelete(req.params.id);

    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found',
      });
    }

    res.json({
      success: true,
      message: 'Author deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
