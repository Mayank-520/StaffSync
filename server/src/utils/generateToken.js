const jwt = require('jsonwebtoken');

/**
 * Generate a JSON Web Token (JWT) with user ID and role payload.
 * @param {string} id - The MongoDB user ID
 * @param {string} role - The user's role ('admin', 'manager', 'employee')
 * @returns {string} Signed JWT token
 */
const generateToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

module.exports = generateToken;
