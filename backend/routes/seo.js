const express = require('express');
const router = express.Router();
const { getSeoSettings, updateSeoSetting } = require('../controllers/seoController');
const { authenticate } = require('../middleware/auth');

router.route('/')
  .get(getSeoSettings)
  .put(authenticate, updateSeoSetting);

module.exports = router;
