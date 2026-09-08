const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
    maxlength: 100,
  },
  parentName: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true,
  },
  class: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  sessionType: {
    type: String,
    enum: ['career-counselling', 'parent-session', 'school-workshop', 'other'],
    default: 'career-counselling',
  },
  preferredDate: {
    type: String,
  },
  preferredMode: {
    type: String,
    enum: ['online', 'offline'],
    default: 'online',
  },
  message: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  source: {
    type: String,
    enum: ['website', 'admin', 'whatsapp'],
    default: 'website',
  },
}, {
  timestamps: true,
});

bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ phone: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
