const express = require('express');
const { body } = require('express-validator');
const { login, register, getDemoCredentials, getMe, changePassword } = require('../controllers/authController');
const { protect, authorize, requireSelfOrAdmin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

/**
 * Validation rules for login
 */
const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid corporate email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Validation rules for registration
 */
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid corporate email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Department cannot exceed 50 characters'),
  body('designation')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Designation cannot exceed 50 characters')
];

/**
 * Validation rules for password change
 */
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

// Public routes
router.post('/login', loginValidation, validate, login);
router.post('/register', registerValidation, validate, register);
router.get('/demo-credentials', getDemoCredentials);

// Protected routes (Requires valid JWT)
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePasswordValidation, validate, changePassword);

// Role verification routes (Used for permission handshakes and route guards)
router.get('/verify-admin', protect, authorize('admin'), (req, res) => {
  res.status(200).json({ success: true, message: 'HR Administrator access authorized' });
});

router.get('/verify-manager', protect, authorize('admin', 'manager'), (req, res) => {
  res.status(200).json({ success: true, message: 'Manager access authorized' });
});

router.get('/verify-self/:id', protect, requireSelfOrAdmin('id'), (req, res) => {
  res.status(200).json({ success: true, message: 'Authorized self or admin access' });
});

module.exports = router;
