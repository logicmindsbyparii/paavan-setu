const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

const app = express();

// Hosted behind a proxy (Render, Railway, Vercel, nginx). Without this, req.ip
// is the proxy's address, so every visitor shares one rate-limit bucket.
app.set('trust proxy', 1);

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://www.paavansetu.com',
  'https://paavansetu.com',
  'https://paavan-setu.vercel.app',
  'https://paavansetu-frontend.vercel.app',
];

// Vercel preview deployments get a per-commit subdomain
// (paavan-setu-<hash>-<scope>.vercel.app), so match the project's previews too.
const isVercelPreview = (origin) =>
  /^https:\/\/paavan-setu-[a-z0-9-]+\.vercel\.app$/.test(origin);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || isVercelPreview(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV !== 'production') {
      // In development, allow any origin for local tooling
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting (simple in-memory) ────────────────────────────────────────
// Applied to /api only. It used to sit in front of everything, so a single page
// load — images, uploads and API calls together — ate a large slice of the
// budget and legitimate visitors were being 429'd.
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 120; // requests per window per IP

// Stricter budget for endpoints that write or cost money.
const WRITE_LIMIT_MAX = 15;
const isSensitive = (req) =>
  req.method !== 'GET' &&
  /^\/(contact|bookings|orders|admin\/login|users\/login|users\/register)/.test(req.path);

app.use('/api', (req, res, next) => {
  const now = Date.now();
  const key = `${req.ip}:${isSensitive(req) ? 'write' : 'read'}`;
  const max = isSensitive(req) ? WRITE_LIMIT_MAX : RATE_LIMIT_MAX;

  const entry = rateLimit.get(key);
  if (!entry || now > entry.resetTime) {
    rateLimit.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  entry.count += 1;
  if (entry.count > max) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({
      success: false,
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
    });
  }

  next();
});

// Drop expired buckets so the map cannot grow without bound.
const rateLimitSweep = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimit) {
    if (now > entry.resetTime) rateLimit.delete(key);
  }
}, 5 * 60 * 1000);
rateLimitSweep.unref?.(); // Never hold the process open for this timer.

// ─── Seed Media ───────────────────────────────────────────────────────────────
// The catalogue's shipped art lives in uploads/seed/ (committed). Served at
// both /uploads/seed/foo.png and /uploads/foo.png so older database rows that
// still store the pre-seed path keep resolving without a re-seed. Runtime
// uploads no longer touch disk — they are in MongoDB (routes/upload.js).
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));
app.use('/uploads', express.static(path.join(uploadsDir, 'seed'), { maxAge: '7d' }));

// ─── Database Availability Guard ──────────────────────────────────────────────
// When Atlas is unreachable, Mongoose queues every query and each one rejects
// only after bufferTimeoutMS (~10s). That turns a dead database into dozens of
// 10-second hangs. Short-circuit with a fast 503 instead — except /api/health,
// which must stay reachable for Render's health check.
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (mongoose.connection.readyState === 1) return next();
  return res.status(503).json({
    success: false,
    message: 'Database temporarily unavailable. Please try again shortly.',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/contact', require('./routes/contact'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/books', require('./routes/books'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/authors', require('./routes/authors'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/users', require('./routes/auth'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/seo', require('./routes/seo'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Paavan SETU API running 🌟',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── API 404s ─────────────────────────────────────────────────────────────────
// Must come before the SPA catch-all, otherwise an unknown /api/* URL is served
// index.html and the client tries to JSON.parse a page of HTML.
app.use('/api', notFound);

// ─── Serve Static Files (Production) ─────────────────────────────────────────
// Only when a co-located frontend build actually exists. When the frontend is
// deployed separately (Vercel), this directory is absent and sendFile would
// answer every non-API route with a 500.
const frontendBuild = path.join(__dirname, '../frontend/build');
if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(frontendBuild, 'index.html'))) {
  app.use(express.static(frontendBuild));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
}

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    // Without a secret, jwt.sign throws on every login and the admin panel is
    // unusable. Fail loudly at boot rather than at the first request.
    console.error('❌ JWT_SECRET is not set. Add it to backend/.env before starting.');
    process.exit(1);
  }

  if (process.env.MONGODB_URI) {
    // Never blocks startup and never crashes the process: db.js retries in the
    // background with backoff. Until it connects, the /api guard returns 503s
    // and the public site falls back to its bundled content.
    connectDB();
  } else {
    console.warn('⚠️  MONGODB_URI is not set. The API will run without a database.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();

module.exports = app;
