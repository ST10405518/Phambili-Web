// authController.js - Firebase-aware authentication handlers
require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { db } = require('../firebaseConfig');
const customerService = require('../firebase-services/customerService');
const adminService = require('../firebase-services/adminService');
const emailService = require('../utils/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key';
const RESET_TOKEN_COLLECTION = 'password_resets';
const RESET_TOKEN_EXPIRES_IN = process.env.RESET_TOKEN_EXPIRES_IN || '1h';

/**
 * Normalize email input.
 * @param {string} email
 * @returns {string}
 */
function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

/**
 * Trim string values safely.
 * @param {string} value
 * @returns {string}
 */
function safeTrim(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Convert human readable duration like "1h" into milliseconds.
 * Fallbacks to one hour if parsing fails.
 * @param {string|number} duration
 * @returns {number}
 */
function parseDurationToMs(duration) {
  if (typeof duration === 'number' && Number.isFinite(duration)) {
    return duration;
  }

  const match = /^(\d+)\s*([smhd])$/i.exec(duration);
  if (!match) {
    return 60 * 60 * 1000;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return value * (multipliers[unit] || 60 * 60 * 1000);
}

/**
 * Generate a signed JWT token.
 * @param {string} id
 * @param {string} email
 * @param {string} role
 * @param {object} options
 * @returns {string}
 */
function signToken(id, email, role, options = {}) {
  return jwt.sign(
    {
      id,
      email,
      role
    },
    JWT_SECRET,
    options
  );
}

/**
 * Persist a password reset token in Firestore.
 * @param {string} token
 * @param {object} data
 */
async function storeResetToken(token, data) {
  const expiresInMs = parseDurationToMs(RESET_TOKEN_EXPIRES_IN);
  const expiresAt = new Date(Date.now() + expiresInMs).toISOString();

  await db.collection(RESET_TOKEN_COLLECTION).doc(token).set({
    ...data,
    createdAt: new Date().toISOString(),
    expiresAt
  });
}

/**
 * Remove a stored password reset token.
 * @param {string} token
 */
async function removeResetToken(token) {
  await db.collection(RESET_TOKEN_COLLECTION).doc(token).delete().catch(() => null);
}

/**
 * Fetch a stored reset token document.
 * @param {string} token
 * @returns {Promise<FirebaseFirestore.DocumentSnapshot>}
 */
function fetchResetToken(token) {
  return db.collection(RESET_TOKEN_COLLECTION).doc(token).get();
}

/**
 * Find a user (customer/admin) by email.
 * @param {string} email
 * @param {{ includePassword?: boolean }} options
 * @returns {Promise<{ user: object, role: 'admin'|'customer' }|null>}
 */
async function findUserByEmail(email, { includePassword = false } = {}) {
  const method = includePassword ? 'findByEmailWithPassword' : 'findByEmail';

  const customer = await customerService[method](email);
  if (customer) {
    return { user: customer, role: 'customer' };
  }

  const admin = await adminService[method](email);
  if (admin) {
    return { user: admin, role: 'admin' };
  }

  return null;
}

/**
 * Find a user by ID based on role.
 * @param {string} id
 * @param {'admin'|'customer'} role
 * @param {{ includePassword?: boolean }} options
 * @returns {Promise<object|null>}
 */
function findUserById(id, role, { includePassword = false } = {}) {
  const method = includePassword ? 'findByIdWithPassword' : 'findById';
  const service = role === 'admin' ? adminService : customerService;
  return service[method](id);
}

/**
 * Build a safe admin response payload.
 * @param {object} admin
 * @returns {object}
 */
function buildAdminPayload(admin) {
  if (!admin) {
    return null;
  }

  return {
    ID: admin.ID,
    Full_Name: admin.Full_Name || admin.Name || null,
    Email: admin.Email || null,
    Phone: admin.Phone || null,
    Role: admin.Role || 'admin',
    First_Login: admin.First_Login ?? false,
    Created_At: admin.createdAt || admin.Created_At || null,
    Updated_At: admin.updatedAt || admin.Updated_At || null
  };
}

/**
 * Build a safe customer response payload.
 * @param {object} customer
 * @returns {object}
 */
function buildCustomerPayload(customer) {
  if (!customer) {
    return null;
  }

  return {
    ID: customer.ID,
    Full_Name: customer.Full_Name || null,
    Email: customer.Email || null,
    Phone: customer.Phone || null,
    Address: customer.Address || null,
    Created_At: customer.createdAt || customer.Created_At || null,
    Updated_At: customer.updatedAt || customer.Updated_At || null
  };
}

/**
 * Validate password length.
 * @param {string} password
 * @returns {boolean}
 */
function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

exports.register = async (req, res) => {
  try {
    const fullName = safeTrim(req.body.Full_Name);
    const email = normalizeEmail(req.body.Email);
    const password = req.body.Password;
    const phone = safeTrim(req.body.Phone);
    const address = safeTrim(req.body.Address);

    if (!fullName || fullName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid full name.'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const existingCustomer = await customerService.findByEmail(email);
    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered.'
      });
    }

    const customer = await customerService.create({
      Full_Name: fullName,
      Email: email,
      Password: password,
      Phone: phone || null,
      Address: address || null
    });

    const token = signToken(customer.ID, customer.Email, 'customer', { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      role: 'customer',
      user: buildCustomerPayload(customer)
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration.'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.Email);
    const password = req.body.Password;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const userResult = await findUserByEmail(email, { includePassword: true });

    if (!userResult) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please check your email or register for a new account.'
      });
    }

    const { user, role } = userResult;

    if (!user.Password) {
      return res.status(401).json({
        success: false,
        message: 'Account is missing a password. Please contact support.'
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.Password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = signToken(user.ID, user.Email || email, role, {
      expiresIn: role === 'admin' ? '8h' : '7d'
    });

    const userPayload = role === 'admin'
      ? buildAdminPayload(user)
      : buildCustomerPayload(user);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      role,
      user: userPayload
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.'
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.Email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    const userResult = await findUserByEmail(email, { includePassword: true });

    if (!userResult) {
      console.log('📧 Forgot password requested for non-existent email:', email);
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    const { user, role } = userResult;

    const resetToken = jwt.sign(
      {
        id: user.ID,
        email: user.Email || email,
        role,
        purpose: 'password_reset',
        timestamp: Date.now()
      },
      JWT_SECRET,
      { expiresIn: RESET_TOKEN_EXPIRES_IN }
    );

    await storeResetToken(resetToken, {
      userId: user.ID,
      email: user.Email || email,
      role
    });

    console.log(`📧 Password reset token generated for ${email} [${role}]`);

    let emailSent = false;
    if (emailService.isEmailConfigured()) {
      try {
        await emailService.sendPasswordResetEmail(user.Email || email, resetToken, role);
        emailSent = true;
        console.log(`📨 Password reset email sent to ${email}`);
      } catch (mailError) {
        console.error('❌ Failed to send password reset email:', mailError);
      }
    } else {
      console.warn('⚠️ Email service is not configured. Reset link will not be emailed.');
    }

    const shouldExposeToken =
      process.env.NODE_ENV === 'development' || !emailSent;

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      ...(shouldExposeToken ? { resetToken } : {}),
      emailDelivery: emailSent ? 'sent' : 'not_configured'
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request. Please try again later.'
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required.'
      });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.'
      });
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token.'
      });
    }

    const tokenDoc = await fetchResetToken(token);
    if (!tokenDoc.exists) {
      return res.status(400).json({
        success: false,
        message: 'Reset token has already been used or is invalid.'
      });
    }

    const tokenData = tokenDoc.data();
    if (tokenData.expiresAt && new Date(tokenData.expiresAt).getTime() < Date.now()) {
      await removeResetToken(token);
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired.'
      });
    }

    const role = tokenData.role || decoded.role;
    const userId = tokenData.userId || decoded.id;

    const user = await findUserById(userId, role, { includePassword: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const service = role === 'admin' ? adminService : customerService;

    await service.update(userId, {
      Password: newPassword,
      ...(role === 'admin' ? { First_Login: false } : {})
    });

    await removeResetToken(token);

    console.log(`✅ Password reset successfully for ${user.Email} [${role}]`);

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password.'
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.'
      });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const user = await findUserById(userId, role, { includePassword: true });
    if (!user || !user.Password) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.Password);
    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    const service = role === 'admin' ? adminService : customerService;

    await service.update(userId, {
      Password: newPassword,
      ...(role === 'admin' ? { First_Login: false } : {})
    });

    console.log(`✅ Password changed successfully for ${user.Email} [${role}]`);

    res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password. Please try again.'
    });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const { id, role } = req.user;

    const user = await findUserById(id, role);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const payload = role === 'admin'
      ? buildAdminPayload(user)
      : buildCustomerPayload(user);

    res.json({
      success: true,
      user: payload,
      role
    });
  } catch (error) {
    console.error('❌ Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying token.'
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { id, role } = req.user;

    const user = await findUserById(id, role);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const payload = role === 'admin'
      ? buildAdminPayload(user)
      : buildCustomerPayload(user);

    res.json({
      success: true,
      user: payload,
      role
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile.'
    });
  }
};

exports.logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout.'
    });
  }
};
