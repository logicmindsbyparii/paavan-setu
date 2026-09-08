const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

// Public routes
router.get('/', settingsController.getPublicSettings);

// Admin routes
router.get('/admin', authenticate, settingsController.getAllSettings);
router.put('/admin', authenticate, settingsController.updateSettings);
router.put('/admin/:key', authenticate, settingsController.updateSetting);
router.delete('/admin/:key', authenticate, settingsController.deleteSetting);

module.exports = router;
