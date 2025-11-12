// authRoutes.js - Complete routes
const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation schemas
const registerValidation = [
  body('Full_Name').isLength({ min: 2, max: 100 }),
  body('Email').isEmail().normalizeEmail(),
  body('Password').isLength({ min: 6 })
];

const loginValidation = [
  body('Email').isEmail().normalizeEmail(),
  body('Password').isLength({ min: 1 })
];

const forgotPasswordValidation = [
  body('Email').isEmail().normalizeEmail()
];

const resetPasswordValidation = [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 6 })
];

const changePasswordValidation = [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
];

// Public routes
router.post(
  '/register',
  registerValidation,
  validate,
  authController.register
);

router.post(
  '/login',
  loginValidation,
  validate,
  authController.login
);

// Request password reset - POST /auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email required'),
  body('address').isObject().withMessage('Address is required'),
  body('address.Address_Street').notEmpty().withMessage('Street is required'),
  body('address.Address_City').notEmpty().withMessage('City is required'),
  body('address.Address_State').notEmpty().withMessage('State is required'),
  body('address.Address_Postal_Code').notEmpty().withMessage('Postal code is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return generic message to avoid leaking which field failed
    return res.status(400).json({ success: false, message: 'Invalid request', errors: errors.array() });
  }
  return authController.requestPasswordReset(req, res);
});

// Reset password with verification token - POST /auth/reset-password-verified
router.post('/reset-password-verified', [
  body('email').isEmail().withMessage('Valid email required'),
  body('verificationToken').notEmpty().withMessage('Verification token required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Invalid request', errors: errors.array() });
  }
  return authController.resetPasswordVerified(req, res);
});

// Reset password - POST /auth/reset-password
router.post('/reset-password', [
  body('email').isEmail().withMessage('Valid email required'),
  body('token').notEmpty().withMessage('Token required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Invalid request', errors: errors.array() });
  }
  return authController.resetPassword(req, res);
});


router.post(
  '/reset-password',
  resetPasswordValidation,
  validate,
  authController.resetPassword
);

// Protected routes (require authentication)
router.use(auth);

router.post(
  '/change-password',
  changePasswordValidation,
  validate,
  authController.changePassword
);

router.get('/verify', authController.verifyToken);
router.get('/profile', authController.getProfile);
router.post('/logout', authController.logout);

module.exports = router;