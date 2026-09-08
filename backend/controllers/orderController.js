const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Book = require('../models/Book');
const mongoose = require('mongoose');
const { safeRegex, paginate } = require('../utils/query');

// Initialize Razorpay (lazily)
let razorpay = null;
const getRazorpay = () => {
  if (!razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

// ─── Public Routes ────────────────────────────────────────────────────────────

// POST /api/create-order - Create Razorpay order
exports.createOrder = async (req, res, next) => {
  try {
    const { items, customer } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'No items provided',
      });
    }

    if (!customer || !customer.name || !customer.phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and phone are required',
      });
    }

    if (items.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Too many items in one order. Please split it or contact us.',
      });
    }

    // Validate and calculate amount from server-side data
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      // An invalid id would otherwise surface as a CastError 500 rather than a
      // clear 400 the checkout can show.
      if (!mongoose.isValidObjectId(item.bookId)) {
        return res.status(400).json({ success: false, message: 'Invalid book reference' });
      }

      const book = await Book.findById(item.bookId);
      if (!book || !book.isPublished) {
        return res.status(400).json({
          success: false,
          message: `Book ${item.bookId} not found or unavailable`,
        });
      }

      // Quantity comes from the client, so clamp it: a negative value would
      // subtract from the total, and a fractional one would produce a price
      // Razorpay rejects.
      const quantity = Math.floor(Number(item.quantity) || 1);
      if (!Number.isFinite(quantity) || quantity < 1 || quantity > 50) {
        return res.status(400).json({
          success: false,
          message: `Quantity for "${book.title}" must be between 1 and 50`,
        });
      }

      if (book.stock < quantity) {
        return res.status(409).json({
          success: false,
          message: book.stock > 0
            ? `Only ${book.stock} copies of "${book.title}" are left.`
            : `"${book.title}" is out of stock.`,
        });
      }

      const price = book.salePrice || book.price;
      subtotal += price * quantity;

      orderItems.push({
        book: book._id,
        title: book.title,
        price,
        quantity,
      });
    }

    // Minimum amount check (100 paise = ₹1)
    if (subtotal < 1) {
      return res.status(400).json({
        success: false,
        message: 'Order total must be at least ₹1',
      });
    }

    const total = subtotal; // Add shipping logic here if needed

    // Create Razorpay order
    const razorpayInstance = getRazorpay();
    if (!razorpayInstance) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway not configured',
      });
    }

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: Math.round(total * 100), // Convert to paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        customerName: customer.name,
        customerEmail: customer.email || '',
        itemCount: orderItems.length,
      },
    });

    // Create order in database
    const order = await Order.create({
      customer,
      items: orderItems,
      subtotal,
      total,
      payment: {
        razorpayOrderId: razorpayOrder.id,
        amount: total,
        currency: 'INR',
      },
    });

    res.status(201).json({
      success: true,
      data: {
        orderId: order._id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    next(error);
  }
};

// POST /api/verify-payment - Verify Razorpay payment
exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification data',
      });
    }

    // Verify signature using HMAC-SHA256
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    // timingSafeEqual needs equal-length buffers; both are hex digests of the
    // same algorithm, so a length mismatch already means "not authentic".
    const expected = Buffer.from(expectedSignature, 'utf8');
    const received = Buffer.from(String(razorpay_signature), 'utf8');
    const isAuthentic =
      expected.length === received.length && crypto.timingSafeEqual(expected, received);

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    // Claim the order atomically. The `status: 'paid'` guard means a repeated
    // callback (Razorpay retries, a double-submit, a refreshed tab) matches
    // nothing the second time, so stock is only ever decremented once.
    const order = await Order.findOneAndUpdate(
      {
        'payment.razorpayOrderId': razorpay_order_id,
        status: { $ne: 'paid' },
      },
      {
        $set: {
          status: 'paid',
          'payment.razorpayPaymentId': razorpay_payment_id,
          'payment.razorpaySignature': razorpay_signature,
          'payment.verified': true,
          'payment.paidAt': new Date(),
        },
      },
      { new: true }
    );

    if (!order) {
      // Either the order does not exist, or it was already marked paid. Look it
      // up to tell those apart — a replay should still report success so the
      // customer is not told their completed payment failed.
      const existing = await Order.findOne({
        'payment.razorpayOrderId': razorpay_order_id,
      });

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      return res.json({
        success: true,
        message: 'Payment already verified',
        data: { orderNumber: existing.orderNumber, status: existing.status },
      });
    }

    // Update book stock. Failures here must not fail the request — the payment
    // has already gone through, and stock can be corrected in the admin panel.
    try {
      await Promise.all(
        order.items.map((item) =>
          Book.findByIdAndUpdate(item.book, { $inc: { stock: -item.quantity } })
        )
      );
    } catch (stockError) {
      console.error('Stock update failed for order', order.orderNumber, stockError);
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    next(error);
  }
};

// POST /api/payment/fallback - Handle payment failure/cancellation
exports.handlePaymentFailure = async (req, res, next) => {
  try {
    const { razorpay_order_id, error } = req.body;

    if (razorpay_order_id) {
      // This endpoint is public (the browser reports the failure), so it must
      // only ever move an order *forward* from pending. Without the status
      // guard anyone who learned an order id could flip a completed, paid order
      // to "failed".
      await Order.findOneAndUpdate(
        {
          'payment.razorpayOrderId': razorpay_order_id,
          status: 'pending',
        },
        {
          $set: {
            status: 'failed',
            notes: `Payment failed: ${String(error?.description || 'Unknown error').slice(0, 500)}`,
          },
        }
      );
    }

    // Always a plain acknowledgement: this is best-effort telemetry, and
    // revealing whether an order id exists would let it be probed.
    res.json({
      success: true,
      message: 'Payment failure recorded',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Admin Routes ─────────────────────────────────────────────────────────────

// GET /api/admin/orders - Admin: Get all orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, search, sort = '-createdAt' } = req.query;
    const { page, limit, skip } = paginate(req.query);

    const query = {};
    if (status) query.status = status;
    if (search) {
      // Escaped: the raw value used to be compiled as a regex pattern.
      const term = safeRegex(search);
      query.$or = [
        { orderNumber: term },
        { 'customer.name': term },
        { 'customer.email': term },
        { 'customer.phone': term },
      ];
    }

    const [total, orders] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('items.book', 'title coverImage'),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/orders/:id - Admin: Get single order
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.book', 'title coverImage price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/orders/:id/status - Admin: Update order status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'paid', 'failed', 'cancelled', 'refunded', 'completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: order,
      message: 'Order status updated',
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/orders/stats - Admin: Order statistics
exports.getOrderStats = async (req, res, next) => {
  try {
    // Recent orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const PAID = { $in: ['paid', 'completed'] };

    // Run the counts concurrently — they were awaited one after another, so the
    // dashboard paid eight sequential round-trips before rendering.
    const [
      totalOrders,
      totalRevenue,
      pendingOrders,
      failedOrders,
      recentOrders,
      recentRevenue,
      totalBooks,
      publishedBooks,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: PAID } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'failed' }),
      Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Order.aggregate([
        { $match: { status: PAID, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      // The dashboard reads `totalBooks`, which this endpoint never returned —
      // that card sat empty regardless of the catalogue size.
      Book.countDocuments(),
      Book.countDocuments({ isPublished: true }),
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingOrders,
        failedOrders,
        recentOrders,
        recentRevenue: recentRevenue[0]?.total || 0,
        totalBooks,
        publishedBooks,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an order
// @route   DELETE /api/orders/admin/:id
// @access  Private/Admin
exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
