const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const testController = require('../controllers/testController');
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
router.get('/test-results/:testSlug', authenticate, adminController.getTestResultsBySlug);
router.get('/test-analytics', authenticate, adminController.getTestAnalytics);
// Per-test analytics lives in testController: it is the enriched implementation
// (drop-off, item analysis, pass/fail, timing) that the dashboard renders. The
// route previously pointed at a thinner duplicate, so those panels never
// received data and silently rendered nothing.
router.get('/test-analytics/:testSlug', authenticate, testController.getTestAnalyticsBySlug);
router.delete('/test-results/:id', authenticate, adminController.deleteTestResult);

// Coupon Management
router.get('/coupons', authenticate, adminController.getAllCoupons);
router.post('/coupons', authenticate, adminController.createCoupon);
router.put('/coupons/bulk', authenticate, adminController.bulkUpdateCoupons);
router.get('/coupons/:id', authenticate, adminController.getCouponById);
router.put('/coupons/:id', authenticate, adminController.updateCoupon);
router.delete('/coupons/:id', authenticate, adminController.deleteCoupon);

// Users Management
router.get('/users', authenticate, adminController.getAllUsers);
router.put('/users/:id', authenticate, adminController.updateUser);
router.put('/users/:id/toggle', authenticate, adminController.toggleUserStatus);
router.put('/users/:id/reset-password', authenticate, adminController.resetUserPassword);
router.delete('/users/:id', authenticate, adminController.deleteUser);

module.exports = router;
