const Seo = require('../models/Seo');

// @desc    Get all SEO settings
// @route   GET /api/seo
// @access  Public
const getSeoSettings = async (req, res) => {
  try {
    const seoSettings = await Seo.find({});
    res.json({
      success: true,
      data: seoSettings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error fetching SEO settings',
    });
  }
};

// @desc    Update or Create an SEO setting
// @route   PUT /api/seo
// @access  Private/Admin
const updateSeoSetting = async (req, res) => {
  try {
    const { path, title, description, keywords, ogTitle, ogDescription, ogImage } = req.body;
    
    if (!path || !title) {
      return res.status(400).json({
        success: false,
        message: 'Path and title are required',
      });
    }

    let seoSetting = await Seo.findOne({ path });
    
    if (seoSetting) {
      // Update
      seoSetting.title = title;
      seoSetting.description = description || '';
      seoSetting.keywords = keywords || '';
      seoSetting.ogTitle = ogTitle || '';
      seoSetting.ogDescription = ogDescription || '';
      seoSetting.ogImage = ogImage || '';
      
      const updatedSeo = await seoSetting.save();
      res.json({
        success: true,
        data: updatedSeo,
      });
    } else {
      // Create
      const newSeo = await Seo.create({
        path,
        title,
        description,
        keywords,
        ogTitle,
        ogDescription,
        ogImage
      });
      
      res.status(201).json({
        success: true,
        data: newSeo,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error updating SEO setting',
    });
  }
};

module.exports = {
  getSeoSettings,
  updateSeoSetting,
};
