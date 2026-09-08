const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const Admin = require('../models/Admin');

// Public routes
router.post('/login', adminController.login);

// First-time registration only — blocked once any admin exists
router.post('/register', async (req, res, next) => {
  try {
    const count = await Admin.countDocuments();
    if (count > 0) {
      return res.status(403).json({
        success: false,
        message: 'Registration is closed. Ask an existing admin to create accounts.',
      });
    }
    return adminController.register(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Protected routes
router.get('/profile', authenticate, adminController.getProfile);
router.put('/profile', authenticate, adminController.updateProfile);
router.put('/password', authenticate, adminController.changePassword);

// Admin management — only super-admin can create new admins
router.post('/create', authenticate, authorize('super-admin'), adminController.createBySuperAdmin);

// Test Analytics
router.get('/test-results', authenticate, adminController.getAllTestResults);

// Users Management
router.get('/users', authenticate, adminController.getAllUsers);
router.put('/users/:id', authenticate, adminController.updateUser);
router.put('/users/:id/toggle', authenticate, adminController.toggleUserStatus);
router.delete('/users/:id', authenticate, adminController.deleteUser);

module.exports = router;
