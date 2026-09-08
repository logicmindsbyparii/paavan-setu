const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { authenticate } = require('../middleware/auth');

// POST /api/bookings — Create a booking
router.post('/', async (req, res) => {
  try {
    const {
      studentName,
      parentName,
      email,
      phone,
      class: cls,
      city,
      sessionType,
      preferredDate,
      preferredMode,
      message,
    } = req.body;

    if (!studentName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Student name and phone are required.',
      });
    }

    // Save to database if connected
    let booking;
    try {
      booking = await Booking.create({
        studentName,
        parentName,
        email,
        phone,
        class: cls,
        city,
        sessionType,
        preferredDate,
        preferredMode,
        message,
      });
    } catch (dbError) {
      console.log('DB save skipped:', dbError.message);
    }

    res.status(201).json({
      success: true,
      message: "Booking request received! We'll confirm your session within 24 hours.",
      data: {
        id: booking?._id,
        studentName,
        parentName,
        email,
        phone,
        class: cls,
        city,
        sessionType,
        preferredDate,
        preferredMode,
        message,
      },
    });

  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
    });
  }
});

// GET /api/bookings (admin only)
router.get('/', authenticate, async (req, res) => {
  try {
    const bookings = await Booking.find().sort('-createdAt').limit(100);
    res.json({
      success: true,
      data: bookings,
    });
  } catch (err) {
    res.json({
      success: true,
      data: [],
      message: 'Database not connected',
    });
  }
});

module.exports = router;
