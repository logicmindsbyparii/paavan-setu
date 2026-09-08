const mongoose = require('mongoose');

// Fail queries fast instead of queuing them for 10s when the connection is
// down. Without this, every request against a dead database hangs until
// `bufferTimeoutMS` elapses and logs a "buffering timed out" error.
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', true);

let started = false;

// Retry forever with capped backoff. The initial `mongoose.connect()` promise
// rejects on the first failure and never retries on its own, so a transient
// Atlas outage (or an IP allowlist that gets fixed a minute later) would
// otherwise leave the process permanently disconnected until a manual redeploy.
const connectWithRetry = async (attempt = 1) => {
  const delayMs = Math.min(30000, 2 ** attempt * 1000); // 2s, 4s, 8s … max 30s
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(
      `❌ MongoDB connection failed (attempt ${attempt}): ${error.message}`
    );
    console.error(`   Retrying in ${delayMs / 1000}s…`);
    setTimeout(() => connectWithRetry(attempt + 1), delayMs).unref?.();
  }
};

const connectDB = async () => {
  if (started) return;
  started = true;

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected. The driver will keep retrying.');
  });
  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
  });

  await connectWithRetry();
};

module.exports = connectDB;
