const Admin = require('../models/Admin');
const { generateToken } = require('../utils/token');

// POST /api/admin/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const admin = await Admin.findOne({ email, isActive: true }).select('+password');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await admin.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(admin._id);

    // Update last login
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    res.json({
      success: true,
      token,
      admin: admin.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/register (first admin only — becomes super-admin)
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    // Check if any admin exists
    const adminCount = await Admin.countDocuments();
    
    if (adminCount > 0) {
      return res.status(403).json({
        success: false,
        message: 'Admin registration is closed. Contact existing admin.',
      });
    }

    const admin = await Admin.create({
      name,
      email,
      password,
      role: 'super-admin',
    });

    const token = generateToken(admin._id);

    res.status(201).json({
      success: true,
      token,
      admin: admin.toJSON(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }
    next(error);
  }
};

// POST /api/admin/create (super-admin only — additional admins/editors)
exports.createBySuperAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    const targetRole = ['admin', 'editor', 'viewer'].includes(role) ? role : 'admin';

    const admin = await Admin.create({
      name,
      email,
      password,
      role: targetRole,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      admin: admin.toJSON(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }
    next(error);
  }
};

// GET /api/admin/profile
exports.getProfile = async (req, res, next) => {
  try {
    res.json({
      success: true,
      admin: req.admin,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email;

    const admin = await Admin.findByIdAndUpdate(
      req.adminId,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      admin,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters',
      });
    }

    const admin = await Admin.findById(req.adminId).select('+password');
    const isMatch = await admin.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    admin.password = newPassword;
    await admin.save();

    const token = generateToken(admin._id);

    res.json({
      success: true,
      message: 'Password updated successfully',
      token,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/test-results
// Defaults to finished attempts. Abandoned ones are analytics telemetry and
// would otherwise read as submissions in the results table; pass
// ?status=abandoned or ?status=all to inspect them deliberately.
exports.getAllTestResults = async (req, res, next) => {
  try {
    const TestResult = require('../models/TestResult');
    const { status } = req.query;
    const filter = status === 'all'
      ? {}
      : status === 'abandoned'
        ? { status: 'abandoned' }
        : { status: { $ne: 'abandoned' } };

    // `-answers -answerDetails` drops the per-question answer map (the largest
    // part of each document) — the results table and its detail dialog render
    // from resultData/questionStats and never read either field.
    const results = await TestResult.find(filter)
      .select('-answers -answerDetails')
      .populate('user', 'name email')
      .sort('-createdAt');

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users
exports.getAllUsers = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const users = await User.find().sort('-createdAt');
    
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/users/:id
exports.updateUser = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/users/:id/toggle
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/users/:id/reset-password
exports.resetUserPassword = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    user.password = newPassword;
    user.resetPasswordRequested = false;
    await user.save();
    
    res.json({ success: true, message: 'Password updated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/test-results/:testSlug
exports.getTestResultsBySlug = async (req, res, next) => {
  try {
    const TestResult = require('../models/TestResult');
    const { status } = req.query;
    const filter = { testSlug: req.params.testSlug };
    if (status !== 'all') filter.status = status === 'abandoned' ? 'abandoned' : { $ne: 'abandoned' };
    // Same projection as the all-tests list: this list is not paginated, so
    // shipping everyone's full answer map was the bulk of the response.
    const results = await TestResult.find(filter)
      .select('-answers -answerDetails')
      .populate('user', 'name email')
      .sort('-completedAt');

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/test-results/:id
exports.deleteTestResult = async (req, res, next) => {
  try {
    const TestResult = require('../models/TestResult');
    const result = await TestResult.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Test result not found' });
    
    res.json({ success: true, message: 'Test result deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/test-analytics — aggregate stats across all tests
exports.getTestAnalytics = async (req, res, next) => {
  try {
    const TestResult = require('../models/TestResult');
    const Test = require('../models/Test');

    const finishedFilter = { status: { $ne: 'abandoned' } };
    const totalSubmissions = await TestResult.countDocuments(finishedFilter);
    const abandonedAttempts = await TestResult.countDocuments({ status: 'abandoned' });
    const resultsByTest = await TestResult.aggregate([
      { $match: finishedFilter },
      { $group: { _id: '$testSlug', count: { $sum: 1 }, avgTime: { $avg: '$timeTaken' } } },
      { $sort: { count: -1 } },
    ]);
    const abandonedByTest = await TestResult.aggregate([
      { $match: { status: 'abandoned' } },
      { $group: { _id: '$testSlug', count: { $sum: 1 } } },
    ]);

    const tests = await Test.find({}, 'slug name categories scoringMode').sort('name');

    const analytics = {
      totalSubmissions,
      abandonedAttempts,
      completionRate: (totalSubmissions + abandonedAttempts) > 0
        ? Math.round((totalSubmissions / (totalSubmissions + abandonedAttempts)) * 100)
        : null,
      tests: tests.map(test => {
        const stats = resultsByTest.find(r => r._id === test.slug);
        const dropped = abandonedByTest.find(r => r._id === test.slug);
        const submissions = stats ? stats.count : 0;
        const abandoned = dropped ? dropped.count : 0;
        return {
          slug: test.slug,
          name: test.name,
          categories: test.categories,
          scoringMode: test.scoringMode || 'profile',
          submissions,
          abandoned,
          completionRate: (submissions + abandoned) > 0
            ? Math.round((submissions / (submissions + abandoned)) * 100)
            : null,
          avgTimeSeconds: stats ? Math.round(stats.avgTime || 0) : 0,
        };
      }),
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════════════════════════════
// COUPON MANAGEMENT
// ══════════════════════════════════════════════════════════════════════

const Coupon = require('../models/Coupon');

// GET /api/admin/coupons — list all coupons
exports.getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort('-createdAt');
    res.json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/coupons — create a new coupon
exports.createCoupon = async (req, res, next) => {
  try {
    const { code, description, maxUsage, expiresAt } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const upperCode = code.toUpperCase().trim();

    const existing = await Coupon.findOne({ code: upperCode });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A coupon with this code already exists' });
    }

    const coupon = await Coupon.create({
      code: upperCode,
      description: description || '',
      maxUsage: maxUsage || 1,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.adminId,
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A coupon with this code already exists' });
    }
    next(error);
  }
};

// PUT /api/admin/coupons/:id — update a coupon
exports.updateCoupon = async (req, res, next) => {
  try {
    const { description, maxUsage, expiresAt, isActive } = req.body;

    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    if (description !== undefined) coupon.description = description;
    if (maxUsage !== undefined) coupon.maxUsage = maxUsage;
    if (expiresAt !== undefined) coupon.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isActive !== undefined) coupon.isActive = isActive;

    await coupon.save();
    res.json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/coupons/:id
exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/coupons/:id — single coupon details
exports.getCouponById = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/coupons/bulk — bulk deactivate/reactivate
exports.bulkUpdateCoupons = async (req, res, next) => {
  try {
    const { ids, isActive } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids array is required' });
    }
    const updated = await Coupon.updateMany(
      { _id: { $in: ids } },
      { isActive, $set: { updatedAt: new Date() } }
    );
    res.json({ success: true, data: { modifiedCount: updated.modifiedCount } });
  } catch (error) {
    next(error);
  }
};
