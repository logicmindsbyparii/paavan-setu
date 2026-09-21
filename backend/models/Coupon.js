const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    uppercase: true,
    unique: true,
    trim: true,
    minlength: [6, 'Coupon code must be at least 6 characters'],
    maxlength: [12],
  },
  description: {
    type: String,
    default: '',
  },
  maxUsage: {
    type: Number,
    default: 1,
    min: [1, 'maxUsage must be at least 1'],
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
}, {
  timestamps: true,
});

// Check usage before saving
couponSchema.pre('save', function (next) {
  if (this.isModified('usedCount') && this.usedCount >= this.maxUsage) {
    this.isActive = false;
  }
  next();
});

// Text index for searching
couponSchema.index({ code: 'text', description: 'text' });

module.exports = mongoose.model('Coupon', couponSchema);
