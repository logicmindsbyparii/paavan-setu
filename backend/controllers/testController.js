const TestResult = require('../models/TestResult');
const Test = require('../models/Test');

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────

exports.getPublicTests = async (req, res, next) => {
  try {
    // Only return metadata, not the full questions array for the list view
    const tests = await Test.find({}, '-questions').sort('createdAt');
    res.json({ success: true, data: tests });
  } catch (error) {
    next(error);
  }
};

exports.getTestBySlug = async (req, res, next) => {
  try {
    const test = await Test.findOne({ slug: req.params.slug });
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    res.json({ success: true, data: test });
  } catch (error) {
    next(error);
  }
};

// ─── USER TEST TAKING ─────────────────────────────────────────────────────────

exports.submitTest = async (req, res, next) => {
  try {
    const { testSlug, testName, answers, resultData, topRecommendation } = req.body;

    if (!testSlug || !testName || !resultData || !topRecommendation) {
      return res.status(400).json({ success: false, message: 'Incomplete test data' });
    }

    const testResult = await TestResult.create({
      user: req.userId,
      testSlug,
      testName,
      resultData,
      topRecommendation,
    });

    res.status(201).json({
      success: true,
      data: testResult,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyResults = async (req, res, next) => {
  try {
    const results = await TestResult.find({ user: req.userId }).sort('-createdAt');
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

exports.getAllTests = async (req, res, next) => {
  try {
    const tests = await Test.find().sort('-createdAt');
    res.json({ success: true, data: tests });
  } catch (error) {
    next(error);
  }
};

exports.createTest = async (req, res, next) => {
  try {
    const test = await Test.create(req.body);
    res.status(201).json({ success: true, data: test });
  } catch (error) {
    next(error);
  }
};

exports.updateTest = async (req, res, next) => {
  try {
    const test = await Test.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    res.json({ success: true, data: test });
  } catch (error) {
    next(error);
  }
};

exports.deleteTest = async (req, res, next) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    res.json({ success: true, message: 'Test deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.seedTests = async (req, res, next) => {
  try {
    // Dynamically require the data since we only need it once
    // Usually it's better to avoid frontend imports in backend, but for a one-off migration it's fine.
    // However, Node might fail on ES6 export const syntax in testData.js.
    // So let's just parse it or hardcode a fallback if we can't import it.
    
    // Instead of importing, we'll expect the admin to POST the data in the body
    const { testsData } = req.body;
    
    if (!testsData || typeof testsData !== 'object') {
      return res.status(400).json({ success: false, message: 'Please provide testsData in request body' });
    }

    const testArray = Object.keys(testsData).map(slug => {
      const data = testsData[slug];
      return {
        slug,
        name: data.name,
        description: data.description,
        categories: data.categories,
        questions: data.questions
      };
    });

    await Test.deleteMany({});
    const created = await Test.insertMany(testArray);

    res.status(201).json({ success: true, message: `Seeded ${created.length} tests`, data: created });
  } catch (error) {
    next(error);
  }
};
