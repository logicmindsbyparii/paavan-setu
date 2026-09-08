const mongoose = require('mongoose');

// Render's filesystem is ephemeral — anything multer writes to disk is gone on
// the next deploy or restart, which is why admin-uploaded covers kept turning
// into broken images in production. Storing the bytes in MongoDB keeps them for
// as long as the record exists, with no external bucket to configure.
const uploadSchema = new mongoose.Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    originalName: { type: String },
    size: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Upload', uploadSchema);
