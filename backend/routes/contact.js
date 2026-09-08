const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { authenticate } = require('../middleware/auth');

const getResend = () => {
  const key = process.env.RESEND_API_KEY;
  if (!key || key.startsWith('re_123') || key.includes('placeholder')) return null;
  const { Resend } = require('resend');
  return new Resend(key);
};

const escapeHtml = (value) =>
  String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required.',
      });
    }

    // Save to database if connected
    try {
      await Contact.create({
        name,
        email,
        phone,
        service,
        message,
      });
    } catch (dbError) {
      // Database might not be connected, continue with email
      console.log('DB save skipped:', dbError.message);
    }

    // Send email notification
    try {
      const resend = getResend();
      if (resend) {
        await resend.emails.send({
          from: 'Paavan Setu <onboarding@resend.dev>',
          to: process.env.EMAIL_USER,
          subject: `New Contact - ${service || 'General'}`,
          html: `
            <h2>New Contact Submission</h2>
            <p><b>Name:</b> ${escapeHtml(name)}</p>
            <p><b>Phone:</b> ${escapeHtml(phone)}</p>
            <p><b>Email:</b> ${escapeHtml(email || 'N/A')}</p>
            <p><b>Service:</b> ${escapeHtml(service || 'N/A')}</p>
            <p><b>Message:</b> ${escapeHtml(message || 'N/A')}</p>
          `,
        });

        // Auto-reply if email provided
        if (email) {
          await resend.emails.send({
            from: 'paavan.setu@gmail.com',
            to: email,
            subject: "We've received your message",
            html: `
              <p>Hi ${escapeHtml(name)},</p>
              <p>Thank you for reaching out to Paavan Setu.</p>
              <p>We have received your message and will get back to you within 24 hours.</p>
              <p>${escapeHtml(message || '')}</p>
              <br>
              <p>Best regards,<br>Team Paavan Setu</p>
            `,
          });
        }
      }
    } catch (emailError) {
      console.error('Email error:', emailError.message);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully!',
    });

  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
    });
  }
});

// GET /api/contact (admin only)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && ['new', 'read', 'replied'].includes(status)) {
      filter.status = status;
    }
    const contacts = await Contact.find(filter).sort('-createdAt').limit(200);
    res.json({
      success: true,
      data: contacts,
    });
  } catch (err) {
    res.json({
      success: true,
      data: [],
      message: 'Database not connected',
    });
  }
});

// GET /api/contact/:id (admin only) — single contact detail
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    res.json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
});

// PUT /api/contact/:id (admin only) — update contact status
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['new', 'read', 'replied'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    res.json({ success: true, data: contact, message: 'Contact updated' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/contact/:id (admin only) — delete contact
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    res.json({ success: true, message: 'Contact deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
