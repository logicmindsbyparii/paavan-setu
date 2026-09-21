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
  answers: {
    type: Object, // key = question index (string), value = { text, points }
    default: {},
  },
  resultData: {
    type: Object, // key = category, value = score
    default: {},
  },
  topRecommendation: {
    type: String,
    required: true,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
  timeTaken: {
    type: Number, // seconds
    default: 0,
  },
  answerDetails: {
    type: Object, // key = question index (string), value = selected option text
    default: {},
  },
  questionStats: {
    type: Object, // key = question index (string), value = { selectedOption, timeSpentSeconds, correct, flagged }
    default: {},
  },
  /* Keyed-test outcomes. Null/0 for psychometric (profile) tests, so the
     analytics layer can tell "scored 0" apart from "not scored". */
  score: { type: Number, default: null },
  maxScore: { type: Number, default: null },
  percentage: { type: Number, default: null },
  passed: { type: Boolean, default: null },
  /* Highest question index the attempt reached — the metric drop-off is built
     from. Stored even when a submission is never finalised. */
  lastQuestionIndex: { type: Number, default: null },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['completed','abandoned'],
    default: 'completed',
  },
}, {
  timestamps: true,
});

// ─── Prevent the same user submitting the same test twice ─────────────────────
testResultSchema.index({ user: 1, testSlug: 1 }, { unique: true });

// Analytics read every attempt for a slug sorted by completion time.
testResultSchema.index({ testSlug: 1, completedAt: -1 });

module.exports = mongoose.model('TestResult', testResultSchema);
