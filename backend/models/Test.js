const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  points: { type: Object, default: {} } // e.g. { "Realistic": 3, "Social": -1 }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [optionSchema]
});

const testSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  categories: [{
    type: String,
    required: true
  }],
  questions: [questionSchema]
}, {
  timestamps: true,
});

module.exports = mongoose.model('Test', testSchema);
