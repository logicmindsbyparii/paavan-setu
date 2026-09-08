const SiteSettings = require('../models/SiteSettings');

// GET /api/settings - Public: Get all settings (filtered)
exports.getPublicSettings = async (req, res, next) => {
  try {
    const settings = await SiteSettings.find({
      category: { $in: ['general', 'contact', 'social', 'footer', 'hero', 'homepage'] },
    }).select('-__v -createdAt -updatedAt');

    // Convert array to key-value object
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    res.json({
      success: true,
      data: settingsObj,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/settings - Admin: Get all settings
exports.getAllSettings = async (req, res, next) => {
  try {
    const { category } = req.query;
    const query = {};
    if (category) query.category = category;

    const settings = await SiteSettings.find(query)
      .sort('key')
      .select('-__v');

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/settings - Admin: Update settings (bulk)
exports.updateSettings = async (req, res, next) => {
  try {
    const { settings } = req.body;

    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        message: 'Settings array is required',
      });
    }

    const updates = [];

    for (const setting of settings) {
      const result = await SiteSettings.findOneAndUpdate(
        { key: setting.key },
        {
          key: setting.key,
          value: setting.value,
          type: setting.type || 'text',
          category: setting.category || 'general',
          description: setting.description,
        },
        { upsert: true, new: true, runValidators: true }
      );
      updates.push(result);
    }

    res.json({
      success: true,
      data: updates,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/settings/:key - Admin: Update single setting
exports.updateSetting = async (req, res, next) => {
  try {
    const { value, type, category, description } = req.body;

    const setting = await SiteSettings.findOneAndUpdate(
      { key: req.params.key },
      {
        value,
        type,
        category,
        description,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: setting,
      message: 'Setting updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/settings/:key - Admin: Delete setting
exports.deleteSetting = async (req, res, next) => {
  try {
    const setting = await SiteSettings.findOneAndDelete({ key: req.params.key });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found',
      });
    }

    res.json({
      success: true,
      message: 'Setting deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
