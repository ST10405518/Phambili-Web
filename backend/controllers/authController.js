// authController.js - Firebase-aware authentication handlers
require('dotenv').config();

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { db } = require('../firebaseConfig');
const customerService = require('../firebase-services/customerService');
const adminService = require('../firebase-services/adminService');
const bookingService = require('../firebase-services/bookingService');
const emailService = require('../utils/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key';
const RESET_TOKEN_COLLECTION = 'password_resets';
const RESET_TOKEN_EXPIRES_IN = process.env.RESET_TOKEN_EXPIRES_IN || '1h';

const SALT_ROUNDS = 10;

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
    PasswordResetRequired: admin.PasswordResetRequired ?? false,
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
      console.log('❌ User not found for email:', email);
      return res.status(404).json({
        success: false,
        message: 'User not found. Please check your email or register for a new account.'
      });
    }

    const { user, role } = userResult;
    console.log('✅ User found:', { email, role, hasPassword: !!user.Password, firstLogin: user.First_Login, passwordResetRequired: user.PasswordResetRequired });

    if (!user.Password) {
      return res.status(401).json({
        success: false,
        message: 'Account is missing a password. Please contact support.'
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.Password);
    console.log('🔐 Password comparison:', { email, passwordMatch, role });
    
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please try again.'
      });
    }

    // Check if admin needs to reset password (first login or password reset required)
    if (role === 'admin' && (user.First_Login || user.PasswordResetRequired)) {
      return res.json({
        success: true,
        requiresPasswordReset: true,
        message: 'Password reset required. Please set a new password.',
        email: user.Email,
        tempPasswordValid: true
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

async function isAddressMatch(user, address) {
  if (!user) return false;
  
  // Handle different possible address storage formats
  let s1, c1, st1, p1;
  
  // Check if address is stored as separate fields
  if (user.Address_Street || user.addressStreet || user.address_street) {
    s1 = (user.Address_Street || user.addressStreet || user.address_street || '').trim().toLowerCase();
    c1 = (user.Address_City || user.addressCity || user.address_city || '').trim().toLowerCase();
    st1 = (user.Address_State || user.addressState || user.address_state || '').trim().toLowerCase();
    p1 = (user.Address_Postal_Code || user.addressPostalCode || user.address_postal_code || '').trim().toLowerCase();
  }
  // Check if address is stored as an object
  else if (user.Address && typeof user.Address === 'object') {
    s1 = (user.Address.Address_Street || user.Address.street || '').trim().toLowerCase();
    c1 = (user.Address.Address_City || user.Address.city || '').trim().toLowerCase();
    st1 = (user.Address.Address_State || user.Address.state || '').trim().toLowerCase();
    p1 = (user.Address.Address_Postal_Code || user.Address.postalCode || '').trim().toLowerCase();
  }
  // Check if address is stored as a formatted string (fallback)
  else if (user.Address && typeof user.Address === 'string') {
    // Try to match against formatted string address
    const providedAddress = `${address.street}, ${address.city}, ${address.state}, ${address.postalCode}`;
    const storedAddress = user.Address.trim();
    const match = storedAddress.toLowerCase() === providedAddress.toLowerCase();
    
    if (!match) {
      console.log('String address mismatch:', {
        stored: storedAddress,
        provided: providedAddress
      });
    }
    
    return match;
  }
  else {
    // No address information found in customer record - check booking records
    console.log('No address in customer record, checking booking history for address verification');
    
    try {
      // Check if customer has any bookings with matching address
      const bookings = await bookingService.findByCustomerId(user.ID);
      
      if (bookings && bookings.length > 0) {
        const providedAddress = `${address.street}, ${address.city}, ${address.state}, ${address.postalCode}`;
        
        // Check if any booking has a matching address
        for (const booking of bookings) {
          if (booking.Address && typeof booking.Address === 'string') {
            const bookingAddress = booking.Address.trim();
            if (bookingAddress.toLowerCase() === providedAddress.toLowerCase()) {
              console.log('Address verified against booking record');
              return true;
            }
          }
        }
        
        console.log('No matching address found in booking records');
        return false;
      }
    } catch (error) {
      console.error('Error checking booking addresses:', error);
    }
    
    console.warn('No address information found for user and no booking records');
    return false;
  }

  const s2 = (address.street || '').trim().toLowerCase();
  const c2 = (address.city || '').trim().toLowerCase();
  const st2 = (address.state || '').trim().toLowerCase();
  const p2 = (address.postalCode || '').trim().toLowerCase();

  const match = s1 === s2 && c1 === c2 && st1 === st2 && p1 === p2;
  
  if (!match) {
    console.log('Address mismatch details:', {
      stored: { street: s1, city: c1, state: st1, postal: p1 },
      provided: { street: s2, city: c2, state: st2, postal: p2 }
    });
  }

  return match;
}

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email, address } = req.body || {};

    if (!email || !address) {
      return res.status(400).json({ success: false, message: 'Email and address are required.' });
    }

    // Find the user by email
    const user = await customerService.findByEmail(email);
    // Security: don't reveal whether the email exists to the client
    if (!user) {
      // Respond with success (to avoid email enumeration) but log for debug
      console.warn(`Password reset requested for unknown email: ${email}`);
      return res.json({ success: false, message: 'The provided information does not match our records.' });
    }

    // Verify address matches stored record
    const addressToMatch = {
      street: address.Address_Street || address.street,
      city: address.Address_City || address.city,
      state: address.Address_State || address.state,
      postalCode: address.Address_Postal_Code || address.postalCode
    };
    
    console.log('Address verification debug:', {
      userEmail: email,
      storedAddress: user.Address,
      providedAddress: addressToMatch,
      addressType: typeof user.Address,
      userId: user.ID
    });
    
    if (!(await isAddressMatch(user, addressToMatch))) {
      // Do not reveal mismatch. Return generic success message.
      console.warn(`Password reset request for ${email} - address mismatch`);
      return res.json({ success: false, message: 'The provided information does not match our records.' });
    }

    // Create a secure verification token for immediate password reset
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Set expiry (15 minutes for verification token)
    const expires = Date.now() + (15 * 60 * 1000);

    // Persist token hash and expiry on user record
    await customerService.update(user.ID || user.id || user._id, {
      resetPasswordToken: tokenHash,
      resetPasswordExpires: new Date(expires).toISOString()
    });

    console.log(`Address verification successful for ${email}, verification token generated`);

    // Return verification token to allow immediate password reset
    return res.json({ 
      success: true, 
      message: 'Address verified successfully. You can now reset your password.',
      verificationToken: verificationToken,
      email: email
    });
  } catch (error) {
    console.error('Error in requestPasswordReset:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.resetPasswordVerified = async (req, res) => {
  try {
    const { email, verificationToken, newPassword } = req.body || {};

    if (!email || !verificationToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, verification token and new password are required.' });
    }

    // Find user by email
    const user = await customerService.findByEmail(email);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid verification token or email.' });
    }

    // Check stored token and expiry
    const storedHash = user.resetPasswordToken;
    const expires = user.resetPasswordExpires ? new Date(user.resetPasswordExpires).getTime() : 0;

    // Hash provided verification token and compare
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    if (!storedHash || storedHash !== tokenHash || Date.now() > expires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });
    }

    // Validate password length
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Update user: set new password, remove token fields
    // Note: customerService.update will handle password hashing
    await customerService.update(user.ID || user.id || user._id, {
      Password: newPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    console.log(`Password reset successful for ${email} via address verification`);

    return res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Error in resetPasswordVerified:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body || {};

    if (!email || !token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, token and new password are required.' });
    }

    // Find user by email
    const user = await customerService.findByEmail(email);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid token or email.' });
    }

    // Check stored token and expiry
    const storedHash = user.resetPasswordToken;
    const expires = user.resetPasswordExpires ? new Date(user.resetPasswordExpires).getTime() : 0;

    // Hash provided token and compare
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    if (!storedHash || storedHash !== tokenHash || Date.now() > expires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token.' });
    }

    // Update user: set new password, remove token fields
    // Note: customerService.update will handle password hashing
    await customerService.update(user.ID || user.id || user._id, {
      Password: newPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    console.log(`Password reset successful for ${email}`);

    return res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
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
