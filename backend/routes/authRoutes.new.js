// authRoutes.js - Complete routes
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const simpleForgotPassword = require('../controllers/simpleForgotPassword');
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

const directResetPasswordValidation = [
  body('Email').isEmail().normalizeEmail(),
  body('NewPassword').isLength({ min: 6 })
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

router.post(
  '/forgot-password',
  forgotPasswordValidation,
  validate,
  authController.forgotPassword
);

router.post(
  '/reset-password',
  resetPasswordValidation,
  validate,
  authController.resetPassword
);

// Simple forgot password routes
router.post(
  '/check-email',
  forgotPasswordValidation,
  validate,
  simpleForgotPassword.checkEmail
);

router.post(
  '/direct-reset-password',
  directResetPasswordValidation,
  validate,
  simpleForgotPassword.directResetPassword
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
