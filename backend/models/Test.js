const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: { 
    type: String, 
    required: function() { return !this.imageUrl; } 
  },
  imageUrl: { type: String, default: '' }, // option image (e.g. sequence choices)
  points: { type: Object, default: {} }, // e.g. { "Realistic": 3, "Social": -1 }
  explanation: { type: String, default: '' }, // shown after answering / on result review
},{ _id: false });

const questionSchema = new mongoose.Schema({
  question: { 
    type: String, 
    required: function() { return !this.imageUrl; }
  },
  options: [optionSchema],
  scenario: { type: String, default: '' },     // optional context line shown above question
  imageUrl: { type: String, default: '' },     // image to display along with the question
  difficulty: { type: String, enum: ['beginner','intermediate','advanced'], default: 'intermediate' },
  tags: [{ type: String, trim: true }],         // e.g. ['logical-reasoning','spatial']
  explanation: { type: String, default: '' },   // per-question explanation
  /* Index of the keyed option for scored tests. Previously undocumented on the
     schema, so Mongoose stripped it on every write and auto-scoring silently
     never happened. `null` = psychometric item with no right answer. */
  correctOptionIndex: { type: Number, default: null, min: 0 },
}, { _id: false });

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  timeLimitMinutes: { type: Number, default: null }, // null = use global test timer
  shuffle: { type: Boolean, default: false },
  questionIndices: [{ type: Number }],          // indices into the test.questions array
  _idx: { type: Number }                        // stable position; not persisted to db, set at runtime
},{ _id: false });

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
  instructions: { type: String, default: '' },
  introMessage: { type: String, default: '' },  // pre-test warm-up screen copy
  categories: [{
    type: String,
    required: true
  }],
  questions: [questionSchema],
  sections: [sectionSchema],                    // null/empty = flat mode (legacy behaviour)
  difficulty: { type: String, enum: ['beginner','intermediate','advanced','mixed'], default: 'mixed' },
  timeLimit: { type: Number, default: null },   // minutes; null = no timer (legacy field)
  passingScore: { type: Number, default: null }, // percentage, e.g. 70
  /* 'profile' = points-vector psychometric scoring (no right answers).
     'scored'  = keyed answers; score = correct / keyed questions, and
     `passingScore` becomes a real pass/fail threshold instead of a heuristic. */
  scoringMode: { type: String, enum: ['profile','scored'], default: 'profile' },
  shuffleQuestions: { type: Boolean, default: false },   // randomised order per attempt
  showExplanations: { type: Boolean, default: true },    // reveal per-question rationale after submit
  allowRetake: { type: Boolean, default: true },
  retakeCooldownMin: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
},{ 
  timestamps: true,
});

/* ─── Scored-test validation ───────────────────────────────────────────────────
   A 'scored' test is only meaningful if every question is keyed to an in-range
   option; otherwise the pass/fail maths silently counts fewer items than the
   attempt answered. Rejected at write time so a half-keyed test never ships. */
testSchema.pre('validate', function(next) {
  if (this.scoringMode !== 'scored') return next();
  const questions = this.questions || [];
  if (questions.length === 0) return next();
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const key = q.correctOptionIndex;
    if (key == null) {
      const err = new Error(`Question ${i + 1} has no correct answer set. A scored test requires a key for every question.`);
      err.status = 400;
      return next(err);
    }
    if (key < 0 || key >= (q.options || []).length) {
      const err = new Error(`Question ${i + 1}: the correct answer points at an option that no longer exists.`);
      err.status = 400;
      return next(err);
    }
  }
  next();
});

// ─── Category validation ───────────────────────────────────────────────────────
// Ensure every points key in every option references a declared category.
testSchema.pre('save', function(next) {
  if (this.isModified('questions') || this.isModified('categories')) {
    const categorySet = new Set(this.categories.map(c => c.trim()));
    const questions = this.questions || [];
    for (const q of questions) {
      for (const opt of (q.options || [])) {
        for (const key of Object.keys(opt.points || {})) {
          if (!categorySet.has(key)) {
            const err = new Error(`Question "${q.question}" option "${opt.text}" points key "${key}" is not in the declared categories.`);
            err.status = 400;
            return next(err);
          }
        }
      }
    }
  }
  next();
});

// ─── Cascade delete TestResults when a Test is removed ────────────────────────
testSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  const TestResult = require('../models/TestResult');
  await TestResult.deleteMany({ testSlug: this.slug });
  next();
});

testSchema.pre('findOneAndDelete', async function(next) {
  const TestResult = require('../models/TestResult');
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    await TestResult.deleteMany({ testSlug: doc.slug });
  }
  next();
});

module.exports = mongoose.model('Test', testSchema);
