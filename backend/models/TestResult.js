const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  testSlug: {
    type: String,
    required: true,
  },
  testName: {
    type: String,
    required: true,
  },
  resultData: {
    type: Object, // Can store score breakdown (e.g. { "Realistic": 15, "Social": 20 })
    required: true,
  },
  topRecommendation: {
    type: String, // The highest scoring category
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('TestResult', testResultSchema);
