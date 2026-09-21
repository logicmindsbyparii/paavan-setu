const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/userAuth');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/me', authenticateUser, getMe);

module.exports = router;
