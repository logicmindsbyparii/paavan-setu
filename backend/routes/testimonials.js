const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');
const { authenticate, authorize } = require('../middleware/auth');
const requireAdmin = authorize('admin', 'super-admin');

// @route   GET /api/testimonials
// @desc    Get all active testimonials (public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: testimonials });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/testimonials/admin
// @desc    Get all testimonials including inactive ones
// @access  Private/Admin
router.get('/admin', authenticate, requireAdmin, async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json({ success: true, data: testimonials });
  } catch (error) {
    console.error('Error fetching admin testimonials:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/testimonials
// @desc    Create a new testimonial
// @access  Private/Admin
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, role, text, isActive } = req.body;
    
    if (!name || !role || !text) {
      return res.status(400).json({ success: false, message: 'Name, role, and text are required' });
    }
    
    const testimonial = await Testimonial.create({
      name,
      role,
      text,
      isActive: isActive !== undefined ? isActive : true
    });
    
    res.status(201).json({ success: true, data: testimonial });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/testimonials/:id
// @desc    Update a testimonial
// @access  Private/Admin
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }
    
    res.json({ success: true, data: testimonial });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/testimonials/:id
// @desc    Delete a testimonial
// @access  Private/Admin
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }
    
    res.json({ success: true, message: 'Testimonial removed' });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
