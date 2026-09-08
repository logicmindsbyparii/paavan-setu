const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { authenticateUser } = require('../middleware/userAuth');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes for fetching tests
router.get('/', testController.getPublicTests);
router.get('/:slug', testController.getTestBySlug);

// User protected routes for taking tests
router.post('/submit', authenticateUser, testController.submitTest);
router.get('/my-results', authenticateUser, testController.getMyResults);

// Admin protected routes for managing tests
router.post('/admin/seed', authenticate, authorize('admin', 'super-admin'), testController.seedTests);
router.get('/admin/all', authenticate, authorize('admin', 'super-admin'), testController.getAllTests);
router.post('/admin', authenticate, authorize('admin', 'super-admin'), testController.createTest);
router.put('/admin/:id', authenticate, authorize('admin', 'super-admin'), testController.updateTest);
router.delete('/admin/:id', authenticate, authorize('admin', 'super-admin'), testController.deleteTest);

module.exports = router;
