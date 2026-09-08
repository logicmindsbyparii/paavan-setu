const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const authorController = require('../controllers/authorController');

// Public routes
router.get('/', authorController.getPublicAuthors);

// Admin routes
router.get('/admin', authenticate, authorController.getAllAuthors);
router.post('/admin', authenticate, authorController.createAuthor);
router.put('/admin/:id', authenticate, authorController.updateAuthor);
router.delete('/admin/:id', authenticate, authorController.deleteAuthor);

module.exports = router;
