/**
 * Admin account maintenance.
 *
 * Replaces the old check_admin.js, which — despite its name — silently reset the
 * first admin's password to a hardcoded 'admin1234' every time it ran, and was
 * duplicated at the repo root. Listing is now read-only, and a password reset
 * must be asked for explicitly with a password you choose.
 *
 *   node scripts/admin.js list
 *   node scripts/admin.js create <email> <password> [name]
 *   node scripts/admin.js reset-password <email> <newPassword>
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const [command, ...args] = process.argv.slice(2);

const USAGE = `
Usage:
  node scripts/admin.js list
  node scripts/admin.js create <email> <password> [name]
  node scripts/admin.js reset-password <email> <newPassword>
`.trim();

async function list() {
  const admins = await Admin.find({}).sort('email');
  if (!admins.length) {
    console.log('No admins found. Create one with:');
    console.log('  node scripts/admin.js create you@example.com <password> "Your Name"');
    return;
  }
  console.log(`${admins.length} admin account(s):`);
  for (const a of admins) {
    const last = a.lastLogin ? a.lastLogin.toISOString() : 'never';
    console.log(`  ${a.email}  role=${a.role}  active=${a.isActive}  lastLogin=${last}`);
  }
}

async function create([email, password, name]) {
  if (!email || !password) throw new Error(USAGE);
  if (password.length < 8) throw new Error('Password must be at least 8 characters.');

  if (await Admin.findOne({ email: email.toLowerCase() })) {
    throw new Error(`An admin with ${email} already exists.`);
  }

  // The first account becomes super-admin so it can create the rest.
  const isFirst = (await Admin.countDocuments()) === 0;
  const admin = await Admin.create({
    name: name || 'Admin',
    email,
    password,
    role: isFirst ? 'super-admin' : 'admin',
  });
  console.log(`Created ${admin.email} (${admin.role}).`);
}

async function resetPassword([email, password]) {
  if (!email || !password) throw new Error(USAGE);
  if (password.length < 8) throw new Error('Password must be at least 8 characters.');

  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin) throw new Error(`No admin found with ${email}.`);

  // Assigning triggers the pre-save hook that hashes it.
  admin.password = password;
  await admin.save();
  console.log(`Password updated for ${admin.email}.`);
}

async function run() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Add it to backend/.env');
  }

  const commands = { list, create, 'reset-password': resetPassword };
  const handler = commands[command];
  if (!handler) throw new Error(USAGE);

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  await handler(args);
}

run()
  .catch((err) => {
    console.error(`\n${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect().catch(() => {}));
