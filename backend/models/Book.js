const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: 200,
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  slug: {
    type: String,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Book description is required'],
    trim: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author',
  },
  authorName: {
    type: String,
    trim: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  categoryName: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  salePrice: {
    type: Number,
    min: 0,
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD'],
  },
  isbn: {
    type: String,
    trim: true,
  },
  pages: {
    type: Number,
    min: 1,
  },
  audience: {
    type: String,
    trim: true,
  },
  language: {
    type: String,
    default: 'English',
    enum: ['English', 'Hindi', 'Gujarati', 'Bilingual'],
  },
  coverImage: {
    type: String, // URL to uploaded image
  },
  coverImageAlt: {
    type: String,
    trim: true,
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  tag: {
    type: String,
    trim: true,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Per-card presentation, editable from the admin panel so the look of a book
  // card can be tuned without a redeploy.
  accent: {
    bg: { type: String, trim: true },
    border: { type: String, trim: true },
    col: { type: String, trim: true },
  },
  imageStyle: {
    objectPosition: { type: String, trim: true, default: 'center' },
    height: { type: String, trim: true, default: '100%' },
  },
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Generate slug from title before saving.
// Non-latin titles (Gujarati/Hindi) strip down to an empty string, so fall back
// to the id and always guarantee uniqueness with a numeric suffix.
bookSchema.pre('save', async function(next) {
  // An explicitly supplied slug always wins — needed for non-latin titles that
  // would otherwise get an opaque id-based slug.
  if (this.isModified('slug') && this.slug) return next();
  if (!this.isModified('title') && this.slug) return next();

  const base = this.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `book-${this._id}`;

  let slug = base;
  for (let i = 2; await this.constructor.exists({ slug, _id: { $ne: this._id } }); i++) {
    slug = `${base}-${i}`;
  }

  this.slug = slug;
  next();
});

// Index for common queries
bookSchema.index({ isPublished: 1, isFeatured: -1 });
bookSchema.index({ category: 1 });
bookSchema.index({ author: 1 });
bookSchema.index({ slug: 1 });
// `language_override` must point at an unused field: the book's own `language`
// holds values like "Gujarati" that MongoDB does not accept as a text-search
// language, and it would otherwise reject the document on save.
bookSchema.index(
  { title: 'text', description: 'text' },
  { language_override: 'textSearchLanguage', default_language: 'english' }
);

module.exports = mongoose.model('Book', bookSchema);
