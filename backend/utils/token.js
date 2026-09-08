const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT for the given user/admin id.
 *
 * @param {string} id       The document _id to embed in the token.
 * @param {string} [expiresIn]  Override the default expiry.  Accepts any
 *   value the `jsonwebtoken` library supports (e.g. '7d', '30d', '1h').
 *   Defaults to process.env.JWT_EXPIRES_IN when set, otherwise '7d'.
 */
function generateToken(id, expiresIn) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '7d',
  });
}

module.exports = { generateToken };
