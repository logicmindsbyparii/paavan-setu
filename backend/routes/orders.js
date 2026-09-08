const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

// Public routes (payment)
router.post('/create-order', orderController.createOrder);
router.post('/verify-payment', orderController.verifyPayment);
router.post('/payment-failure', orderController.handlePaymentFailure);

// Admin routes
router.get('/admin', authenticate, orderController.getAllOrders);
router.get('/admin/stats', authenticate, orderController.getOrderStats);
router.get('/admin/:id', authenticate, orderController.getOrder);
router.put('/admin/:id/status', authenticate, orderController.updateOrderStatus);
router.delete('/admin/:id', authenticate, orderController.deleteOrder);

module.exports = router;
