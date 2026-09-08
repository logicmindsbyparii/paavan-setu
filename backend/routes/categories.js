const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');

// Public routes
router.get('/', categoryController.getPublicCategories);

// Admin routes
router.get('/admin', authenticate, categoryController.getAllCategories);
router.post('/admin', authenticate, categoryController.createCategory);
router.put('/admin/:id', authenticate, categoryController.updateCategory);
router.delete('/admin/:id', authenticate, categoryController.deleteCategory);

module.exports = router;
