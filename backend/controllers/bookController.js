const Book = require('../models/Book');
const { safeRegex, paginate } = require('../utils/query');

// GET /api/books - Public: Get published books
exports.getPublicBooks = async (req, res, next) => {
  try {
    const { category, featured } = req.query;
    const { page, limit, skip } = paginate(req.query, { defaultLimit: 12 });

    const query = { isPublished: true };
    if (category) query.categoryName = category;
    if (featured === 'true') query.isFeatured = true;

    const [total, books] = await Promise.all([
      Book.countDocuments(query),
      Book.find(query)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v'),
    ]);

    res.json({
      success: true,
      data: books,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/books/:slug - Public: Get single book
exports.getBookBySlug = async (req, res, next) => {
  try {
    const book = await Book.findOne({ 
      slug: req.params.slug, 
      isPublished: true 
    }).select('-__v');

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    res.json({
      success: true,
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Admin Routes ─────────────────────────────────────────────────────────────

// GET /api/admin/books - Admin: Get all books
exports.getAllBooks = async (req, res, next) => {
  try {
    const { search, category, status, featured, sort = '-createdAt' } = req.query;
    const { page, limit, skip } = paginate(req.query);

    const query = {};
    if (search) {
      const term = safeRegex(search);
      query.$or = [{ title: term }, { authorName: term }, { isbn: term }];
    }
    if (category) query.categoryName = category;
    if (status === 'published') query.isPublished = true;
    if (status === 'draft') query.isPublished = false;
    if (featured === 'true') query.isFeatured = true;

    const [total, books] = await Promise.all([
      Book.countDocuments(query),
      Book.find(query).sort(sort).skip(skip).limit(limit).select('-__v'),
    ]);

    res.json({
      success: true,
      data: books,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/books - Admin: Create book
exports.createBook = async (req, res, next) => {
  try {
    const book = await Book.create(req.body);

    res.status(201).json({
      success: true,
      data: book,
      message: 'Book created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/books/:id - Admin: Update book
exports.updateBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    res.json({
      success: true,
      data: book,
      message: 'Book updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/books/:id - Admin: Delete book
exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    res.json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/books/:id/toggle - Admin: Toggle featured/published
exports.toggleBook = async (req, res, next) => {
  try {
    const { field } = req.body; // 'isFeatured' or 'isPublished'
    
    if (!['isFeatured', 'isPublished'].includes(field)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid field',
      });
    }

    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    book[field] = !book[field];
    await book.save();

    res.json({
      success: true,
      data: book,
      message: `Book ${field} toggled`,
    });
  } catch (error) {
    next(error);
  }
};
