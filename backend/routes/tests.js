const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { authenticateUser } = require('../middleware/userAuth');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes for fetching tests
router.get('/', testController.getPublicTests);

// User protected routes — must come before /:slug so "my-results" isn't
// captured as a slug parameter.
router.get('/my-results', authenticateUser, testController.getMyResults);
router.post('/submit', authenticateUser, testController.submitTest);
// Partial-attempt telemetry — powers drop-off analytics. Never blocks the runner.
router.post('/abandon', authenticateUser, testController.abandonTest);
router.post('/retake', authenticateUser, testController.retakeTest);
// A coupon is required to sit an assessment. Verified before the attempt starts
// (so a bad code is caught up front) and spent on submit.
router.post('/verify-coupon', authenticateUser, testController.verifyCoupon);

// Public single-test route
router.get('/:slug', testController.getTestBySlug);

// Admin protected routes for managing tests
router.post('/admin/seed', authenticate, authorize('admin', 'super-admin'), testController.seedTests);
router.get('/admin/all', authenticate, authorize('admin', 'super-admin'), testController.getAllTests);
router.post('/admin', authenticate, authorize('admin', 'super-admin'), testController.createTest);
router.put('/admin/:id', authenticate, authorize('admin', 'super-admin'), testController.updateTest);
router.delete('/admin/:id', authenticate, authorize('admin', 'super-admin'), testController.deleteTest);

module.exports = router;