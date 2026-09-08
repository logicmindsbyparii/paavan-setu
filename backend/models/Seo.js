const mongoose = require('mongoose');

const seoSchema = new mongoose.Schema({
  path: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  keywords: {
    type: String,
    trim: true,
  },
  ogTitle: {
    type: String,
    trim: true,
  },
  ogDescription: {
    type: String,
    trim: true,
  },
  ogImage: {
    type: String,
    trim: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Seo', seoSchema);
