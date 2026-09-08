const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const bookController = require('../controllers/bookController');

// Public routes
router.get('/', bookController.getPublicBooks);
router.get('/:slug', bookController.getBookBySlug);

// Admin routes
router.get('/admin/all', authenticate, bookController.getAllBooks);
router.post('/admin', authenticate, bookController.createBook);
router.put('/admin/:id', authenticate, bookController.updateBook);
router.delete('/admin/:id', authenticate, bookController.deleteBook);
router.put('/admin/:id/toggle', authenticate, bookController.toggleBook);

module.exports = router;
