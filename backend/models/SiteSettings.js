const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    trim: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
  },
  type: {
    type: String,
    enum: ['text', 'json', 'image', 'boolean', 'number'],
    default: 'text',
  },
  category: {
    type: String,
    enum: ['general', 'seo', 'social', 'contact', 'hero', 'footer', 'homepage'],
    default: 'general',
  },
  description: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// `key` is the identity of a setting: both updateSettings (bulk) and
// updateSetting (single) call findOneAndUpdate({ key }, …, { upsert: true }).
// Without a uniqueness constraint two concurrent upserts of the same key insert
// two documents, and getPublicSettings then collapses them with
// `settingsObj[s.key] = s.value` — so the live site shows whichever copy the
// cursor happened to return last, and deleting the setting removes only one.
siteSettingsSchema.index({ key: 1 }, { unique: true });
siteSettingsSchema.index({ category: 1 });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
