const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true,
  },
  service: {
    type: String,
    trim: true,
    enum: [
      'Career Counselling',
      'School Workshop',
      'Bulk Book Order',
      'Teacher Training',
      'Parent Workshop',
      'Partnership Enquiry',
      'Other',
    ],
  },
  message: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied'],
    default: 'new',
  },
  source: {
    type: String,
    enum: ['website', 'admin'],
    default: 'website',
  },
}, {
  timestamps: true,
});

contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ email: 1 });

module.exports = mongoose.model('Contact', contactSchema);
