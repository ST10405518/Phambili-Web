// middleware/auth.js - Firebase version
require('dotenv').config();
const jwt = require('jsonwebtoken');
const adminService = require('../firebase-services/adminService');
const customerService = require('../firebase-services/customerService');
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'Access token required' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token format' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('🔐 Auth middleware - Decoded token:', decoded);
    
    // Check if user is admin or customer based on the role in the token
    if (decoded.role === 'admin') {
      // Verify admin still exists
      const admin = await adminService.findById(decoded.id);
      
      if (!admin) {
        return res.status(401).json({ 
          success: false,
          message: 'Admin account no longer exists' 
        });
      }

      req.user = {
        id: admin.ID,
        email: admin.Email,
        role: 'admin',
        name: admin.Name || admin.Full_Name
      };

      console.log(`✅ Admin authenticated: ${admin.Name || admin.Full_Name} (${admin.Email})`);

    } else if (decoded.role === 'customer') {
      // Verify customer still exists
      const customer = await customerService.findById(decoded.id);
      
      if (!customer) {
        return res.status(401).json({ 
          success: false,
          message: 'Customer account no longer exists' 
        });
      }

      req.user = {
        id: customer.ID,
        email: customer.Email,
        role: 'customer',
        name: customer.Full_Name
      };

      console.log(`✅ Customer authenticated: ${customer.Full_Name} (${customer.Email})`);

    } else {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid user role' 
      });
    }

    next();
  } catch (err) {
    console.error('❌ Auth middleware error:', err);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired. Please log in again.' 
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    
    // Handle Firebase errors
    if (err.code && err.code.startsWith('auth/')) {
      console.error('❌ Firebase auth error in middleware:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Authentication service error. Please contact administrator.' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Authentication error' 
    });
  }
};