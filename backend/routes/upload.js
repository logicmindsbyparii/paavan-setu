const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const Upload = require('../models/Upload');
const { authenticate } = require('../middleware/auth');

// Keep the file in memory — it goes straight into MongoDB, never to disk.
// Render wipes the disk on every deploy, so a disk-backed upload becomes a
// broken image within hours.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — well under MongoDB's 16MB doc cap
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image files are allowed.'));
  },
});

// POST /api/upload — store an image, return the URL to reference it by.
router.post('/', authenticate, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'Image is larger than the 5MB limit.'
          : err.message || 'Upload failed.';
      return res.status(400).json({ success: false, message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    try {
      const doc = await Upload.create({
        data: req.file.buffer,
        contentType: req.file.mimetype,
        originalName: req.file.originalname,
        size: req.file.size,
      });

      // Same shape callers already expect: { url }.
      res.json({
        success: true,
        url: `/api/upload/${doc._id}`,
        message: 'Image uploaded successfully',
      });
    } catch (e) {
      console.error('Upload error:', e);
      res.status(500).json({ success: false, message: 'Server error during upload' });
    }
  });
});

// GET /api/upload/:id — serve a stored image.
router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  try {
    const doc = await Upload.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.set('Content-Type', doc.contentType);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(Buffer.from(doc.data)); // normalise MongooseBuffer / Binary → Buffer
  } catch (e) {
    console.error('Upload fetch error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
