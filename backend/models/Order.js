const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
  },
  title: String,
  price: Number,
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
  },
  customer: {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
    },
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  shipping: {
    type: Number,
    default: 0,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'cancelled', 'refunded', 'completed'],
    default: 'pending',
  },
  payment: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    method: String,
    amount: Number,
    currency: String,
    verified: { type: Boolean, default: false },
    paidAt: Date,
  },
  notes: {
    type: String,
    trim: true,
  },
  source: {
    type: String,
    enum: ['website', 'admin', 'phone', 'whatsapp'],
    default: 'website',
  },
}, {
  timestamps: true,
});

/**
 * Monotonic per-month counter used to build order numbers.
 *
 * The previous approach counted existing orders and added one, which two
 * concurrent checkouts could read at the same time — producing duplicate order
 * numbers. A findOneAndUpdate with $inc is atomic, so each caller gets its own
 * value even under load.
 */
const counterSchema = new mongoose.Schema({
  _id: String,      // e.g. "PS202609"
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.models.OrderCounter || mongoose.model('OrderCounter', counterSchema);

orderSchema.pre('save', async function(next) {
  if (!this.isNew || this.orderNumber) return next();

  try {
    const date = new Date();
    const prefix = `PS${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;

    const counter = await Counter.findByIdAndUpdate(
      prefix,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.orderNumber = `${prefix}${String(counter.seq).padStart(4, '0')}`;
    next();
  } catch (error) {
    next(error);
  }
});

// Enforced at the database level: even if the counter were bypassed, two orders
// can never share a number. `sparse` allows the brief pre-save window.
orderSchema.index({ orderNumber: 1 }, { unique: true, sparse: true });

// Indexes
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ 'customer.phone': 1 });
// orderNumber is indexed above with a uniqueness constraint.
orderSchema.index({ 'payment.razorpayOrderId': 1 });

module.exports = mongoose.model('Order', orderSchema);
