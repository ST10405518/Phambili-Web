// adminController.js - Complete Firebase version
const bookingService = require('../firebase-services/bookingService');
const customerService = require('../firebase-services/customerService');
const serviceService = require('../firebase-services/serviceService');
const adminService = require('../firebase-services/adminService');
const productService = require('../firebase-services/productService');
const orderService = require('../firebase-services/orderService');
const paymentService = require('../firebase-services/paymentService');
const galleryService = require('../firebase-services/galleryService');
const storageService = require('../firebase-services/storageService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ==================== DASHBOARD STATISTICS ====================

exports.getDashboardStats = async (req, res) => {
  try {
    // Fetching dashboard stats

    // Get current admin to check role
    const currentAdmin = await adminService.findById(req.user.id);
    const isMainAdmin = currentAdmin.Role === 'main_admin';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all necessary data
    const [allBookings, allCustomers, completedPayments] = await Promise.all([
      bookingService.findAll(),
      customerService.findAll(),
      paymentService.findAll()
    ]);

    // Calculate stats with consistent field names
    const stats = {
      // Use field names that match frontend expectations
      totalRevenue: completedPayments
        .filter(p => p.Status === 'completed' || p.Status === 'confirmed')
        .reduce((sum, p) => sum + (parseFloat(p.Amount) || 0), 0),

      totalBookings: allBookings.length,

      totalCustomers: allCustomers.length,

      pendingBookings: allBookings.filter(b =>
        b.Status === 'requested' || b.Status === 'pending'
      ).length,

      // Additional data for main admin
      ...(isMainAdmin && {
        weeklyRevenue: completedPayments
          .filter(p => {
            const paymentDate = new Date(p.createdAt || p.Created_At);
            return paymentDate >= oneWeekAgo &&
              (p.Status === 'completed' || p.Status === 'confirmed');
          })
          .reduce((sum, p) => sum + (parseFloat(p.Amount) || 0), 0),

        newCustomers: allCustomers.filter(c => {
          const customerDate = new Date(c.createdAt || c.Created_At);
          return customerDate >= oneWeekAgo;
        }).length
      })
    };

    // Dashboard stats calculated

    // Return consistent response format
    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics: ' + error.message
    });
  }
};

// ==================== CUSTOMER MANAGEMENT ====================

exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await customerService.findAll();

    // Remove passwords from response
    const sanitizedCustomers = customers.map(customer => {
      const { Password, ...customerData } = customer;
      return customerData;
    });

    res.json({
      success: true,
      customers: sanitizedCustomers
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await customerService.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Remove password
    const { Password, ...customerData } = customer;

    // Get customer's bookings
    const allBookings = await bookingService.findAll();
    const customerBookings = allBookings.filter(b => b.Customer_ID === id);

    res.json({
      success: true,
      customer: {
        ...customerData,
        bookings: customerBookings
      }
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const customer = await customerService.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Don't allow password updates through this endpoint
    delete updateData.Password;

    await customerService.update(id, updateData);

    const updatedCustomer = await customerService.findById(id);
    const { Password, ...customerData } = updatedCustomer;

    res.json({
      success: true,
      message: 'Customer updated successfully',
      customer: customerData
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await customerService.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    await customerService.delete(id);

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== SERVICE MANAGEMENT ====================

exports.getAllServices = async (req, res) => {
  try {
    const services = await serviceService.findAll();

    res.json({
      success: true,
      services
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createService = async (req, res) => {
  try {
    const { Name, Description, Duration, Category } = req.body;

    if (!Name || !Duration) {
      return res.status(400).json({
        success: false,
        message: 'Name and Duration are required'
      });
    }

    const serviceData = {
      Name,
      Description: Description || '',
      Duration: parseInt(Duration),
      Category: Category || 'General',
      Is_Available: true,
      Image_URL: req.firebaseFileUrl || null
    };

    const service = await serviceService.create(serviceData);

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { Name, Description, Duration, Category, Is_Available } = req.body;

    const service = await serviceService.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const updateData = {};
    if (Name !== undefined) updateData.Name = Name;
    if (Description !== undefined) updateData.Description = Description;
    if (Duration !== undefined) updateData.Duration = parseInt(Duration);
    if (Category !== undefined) updateData.Category = Category;
    if (Is_Available !== undefined) updateData.Is_Available = Is_Available;
    if (req.firebaseFileUrl) updateData.Image_URL = req.firebaseFileUrl;

    await serviceService.update(id, updateData);

    const updatedService = await serviceService.findById(id);

    res.json({
      success: true,
      message: 'Service updated successfully',
      service: updatedService
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await serviceService.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Delete associated image from Firebase Storage if exists
    if (service.Image_URL) {
      try {
        await storageService.deleteFile(service.Image_URL);
      } catch (err) {
        // Could not delete service image
      }
    }

    await serviceService.delete(id);

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.toggleServiceAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    const service = await serviceService.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    await serviceService.update(id, { Is_Available: isAvailable });

    res.json({
      success: true,
      message: `Service ${isAvailable ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Toggle service error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== PRODUCT MANAGEMENT ====================

exports.getAllProducts = async (req, res) => {
  try {
    const products = await productService.findAll();

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { Name, Description, Price, Stock_Quantity, Category } = req.body;

    if (!Name || !Price) {
      return res.status(400).json({
        success: false,
        message: 'Name and Price are required'
      });
    }

    const productData = {
      Name,
      Description: Description || '',
      Price: parseFloat(Price),
      Stock_Quantity: parseInt(Stock_Quantity) || 0,
      Category: Category || 'General',
      Is_Available: true,
      Image_URL: req.firebaseFileUrl || null
    };

    const product = await productService.create(productData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { Name, Description, Price, Stock_Quantity, Category, Is_Available } = req.body;

    const product = await productService.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const updateData = {};
    if (Name !== undefined) updateData.Name = Name;
    if (Description !== undefined) updateData.Description = Description;
    if (Price !== undefined) updateData.Price = parseFloat(Price);
    if (Stock_Quantity !== undefined) updateData.Stock_Quantity = parseInt(Stock_Quantity);
    if (Category !== undefined) updateData.Category = Category;
    if (Is_Available !== undefined) updateData.Is_Available = Is_Available;
    if (req.firebaseFileUrl) updateData.Image_URL = req.firebaseFileUrl;

    await productService.update(id, updateData);

    const updatedProduct = await productService.findById(id);

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await productService.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete associated image from Firebase Storage if exists
    if (product.Image_URL) {
      try {
        await storageService.deleteFile(product.Image_URL);
      } catch (err) {
        // Could not delete product image
      }
    }

    await productService.delete(id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.toggleProductAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { Is_Available } = req.body;

    const product = await productService.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await productService.update(id, { Is_Available });

    res.json({
      success: true,
      message: `Product ${Is_Available ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Toggle product error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== ORDER MANAGEMENT ====================

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await orderService.findAll();

    // Populate customer and product data
    const populatedOrders = await Promise.all(
      orders.map(async (order) => {
        const customer = await customerService.findById(order.Customer_ID);
        const product = await productService.findById(order.Product_ID);

        return {
          ...order,
          Customer: customer ? {
            ID: customer.ID,
            Full_Name: customer.Full_Name,
            Email: customer.Email
          } : null,
          Product: product ? {
            ID: product.ID,
            Name: product.Name,
            Price: product.Price
          } : null
        };
      })
    );

    res.json({
      success: true,
      orders: populatedOrders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== ADMIN PROFILE MANAGEMENT ====================

exports.getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const admin = await adminService.findById(adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Remove password from response
    const { Password, ...adminData } = admin;

    res.json({
      success: true,
      admin: adminData
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { Name, Email, Phone } = req.body;

    const admin = await adminService.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    const updateData = {};
    if (Name) updateData.Name = Name;
    if (Email) updateData.Email = Email;
    if (Phone) updateData.Phone = Phone;

    await adminService.update(adminId, updateData);

    const updatedAdmin = await adminService.findById(adminId);
    const { Password, ...adminData } = updatedAdmin;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      admin: adminData
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.changeAdminPassword = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const admin = await adminService.findByIdWithPassword(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, admin.Password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await adminService.update(adminId, { Password: hashedPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== GALLERY MANAGEMENT ====================

exports.uploadGalleryMedia = async (req, res) => {
  try {
    if (!req.firebaseFileUrl) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { category = 'general', media_type = 'image' } = req.body;

    const galleryData = {
      filename: req.file.originalname,
      url: req.firebaseFileUrl,
      category,
      media_type,
      is_active: true
    };

    const media = await galleryService.create(galleryData);

    res.status(201).json({
      success: true,
      message: 'Media uploaded successfully',
      media
    });
  } catch (error) {
    console.error('Upload gallery media error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllGalleryMedia = async (req, res) => {
  try {
    const media = await galleryService.findAll();

    res.json({
      success: true,
      media
    });
  } catch (error) {
    console.error('Get gallery media error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteGalleryMedia = async (req, res) => {
  try {
    const { id } = req.params;

    const media = await galleryService.findById(id);
    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    // Delete from Firebase Storage
    if (media.url) {
      try {
        await storageService.deleteFile(media.url);
      } catch (err) {
        // Could not delete media file
      }
    }

    await galleryService.delete(id);

    res.json({
      success: true,
      message: 'Media deleted successfully'
    });
  } catch (error) {
    console.error('Delete gallery media error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== PAYMENT MANAGEMENT ====================

exports.getAllPayments = async (req, res) => {
  try {
    const payments = await paymentService.findAll();

    // Populate booking data
    const populatedPayments = await Promise.all(
      payments.map(async (payment) => {
        const booking = await bookingService.findById(payment.Booking_ID);

        return {
          ...payment,
          Booking: booking || null
        };
      })
    );

    res.json({
      success: true,
      payments: populatedPayments
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== MIDDLEWARE & UTILITY FUNCTIONS ====================

exports.checkAdminPermissions = async (req, res, next) => {
  // This middleware is already handled by adminAuth
  // Just pass through
  next();
};

// ==================== STUB FUNCTIONS (Not implemented yet) ====================

exports.firstLoginSetup = async (req, res) => {
  try {
    const { Email, TemporaryPassword, NewPassword } = req.body;

    if (!Email || !TemporaryPassword || !NewPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, temporary password and new password are required.'
      });
    }

    // Find admin by email including password
    const admin = await adminService.findByEmailWithPassword(Email.toLowerCase().trim());
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found.'
      });
    }

    if (!admin.First_Login && !admin.PasswordResetRequired) {
      return res.status(400).json({
        success: false,
        message: 'Password reset not required for this account.'
      });
    }

    if (!admin.Password) {
      return res.status(400).json({
        success: false,
        message: 'Account not properly set up. Please contact administrator.'
      });
    }

    // Verify provided temporary password against stored hash
    const bcrypt = require('bcryptjs');
    const isTempValid = await bcrypt.compare(TemporaryPassword, admin.Password);
    if (!isTempValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid temporary password.'
      });
    }

    // Update password and clear First_Login and PasswordResetRequired flags
    await adminService.update(admin.ID, { 
      Password: NewPassword, 
      First_Login: false, 
      PasswordResetRequired: false,
      Last_Login: new Date().toISOString() 
    });

    // Generate token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';
    const token = jwt.sign(
      {
        id: admin.ID,
        email: admin.Email,
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    const userData = {
      ID: admin.ID,
      Name: admin.Name || admin.Full_Name,
      Email: admin.Email,
      Phone: admin.Phone || null,
      Role: admin.Role || 'admin',
      First_Login: false
    };

    return res.json({
      success: true,
      message: 'Password set successfully.',
      token,
      role: 'admin',
      user: userData
    });

  } catch (error) {
    console.error('First login setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting up account'
    });
  }
};

exports.checkPasswordStatus = async (req, res) => {
  try {
    // Requires adminAuth middleware; read current admin
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const admin = await adminService.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    return res.json({
      success: true,
      requiresReset: !!admin.First_Login
    });
  } catch (error) {
    console.error('checkPasswordStatus error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking password status'
    });
  }
};

exports.resetPassword = async (req, res) => {
  // Use changeAdminPassword instead
  return exports.changeAdminPassword(req, res);
};

exports.createAdmin = async (req, res) => {
  try {
    const { Name, Email, Phone, Role = 'sub_admin' } = req.body;

    // Verify current user is main_admin
    const currentAdmin = await adminService.findById(req.user.id);
    if (!currentAdmin || currentAdmin.Role !== 'main_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only main admin can create other admins'
      });
    }

    // Validate required fields
    if (!Name || !Email) {
      return res.status(400).json({
        success: false,
        message: 'Name and Email are required'
      });
    }

    // Check if admin already exists
    const existing = await adminService.findByEmail(Email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Generate secure temporary password
    const generateTemporaryPassword = () => {
      const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
      const lower = 'abcdefghijkmnopqrstuvwxyz';
      const nums = '23456789';
      const special = '!@#$%^&*()_-+=';
      const all = upper + lower + nums + special;
      const pick = (chars) => chars[Math.floor(Math.random() * chars.length)];
      let result = [
        pick(upper),
        pick(lower),
        pick(nums),
        pick(special)
      ];
      for (let i = result.length; i < 12; i++) {
        result.push(pick(all));
      }
      // simple shuffle
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result.join('');
    };

    const temporaryPassword = generateTemporaryPassword();

    // Hash and create in Firestore using consistent schema
    const bcrypt = require('bcryptjs');
    const { db } = require('../firebaseConfig');
    const hashedTempPassword = await bcrypt.hash(temporaryPassword, 12);

    const adminData = {
      Name: Name.trim(),
      Email: Email.toLowerCase().trim(),
      Phone: Phone ? String(Phone) : null,
      Password: hashedTempPassword,
      First_Login: true,
      Role: Role === 'main_admin' ? 'main_admin' : 'sub_admin',
      Created_By: req.user.id,
      Is_Active: true,
      Created_At: new Date().toISOString(),
      Login_Attempts: 0,
      Locked_Until: null
    };

    const docRef = await db.collection('admins').add(adminData);

    return res.status(201).json({
      success: true,
      message: `${adminData.Role === 'main_admin' ? 'Main admin' : 'Sub-admin'} created successfully`,
      admin: {
        ID: docRef.id,
        Name: adminData.Name,
        Email: adminData.Email,
        Role: adminData.Role,
        First_Login: adminData.First_Login
      },
      temporaryPassword,
      instructions: 'Share the temporary password securely. The admin must set a new password on first login.'
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating admin: ' + (error.message || 'Unknown error')
    });
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await adminService.findAll();
    const sanitizedAdmins = admins.map(admin => {
      const { Password, ...adminData } = admin;
      return adminData;
    });
    res.json({ success: true, admins: sanitizedAdmins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAdminDetails = async (req, res) => {
  try {
    const admin = await adminService.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    const { Password, ...adminData } = admin;
    res.json({ success: true, admin: adminData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAdmin = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Update admin not implemented yet'
  });
};

exports.deleteAdmin = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Delete admin not implemented yet'
  });
};

exports.getBookingAnalytics = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Booking analytics not implemented yet'
  });
};

exports.getCustomerDetails = async (req, res) => {
  return exports.getCustomerById(req, res);
};

exports.getServiceDetails = async (req, res) => {
  try {
    const service = await serviceService.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await productService.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSystemHealth = async (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'Firebase Firestore',
    storage: 'Firebase Storage'
  });
};

// Booking-related functions (use bookingController instead)
exports.getAllBookingsForAdmin = async (req, res) => {
  const bookingController = require('./bookingController');
  return bookingController.getAllBookings(req, res);
};

exports.getBookingStats = async (req, res) => {
  try {
    const [bookings, customers, services, products, orders, payments] = await Promise.all([
      bookingService.findAll(),
      customerService.findAll(),
      serviceService.findAll(),
      productService.findAll(),
      orderService.findAll(),
      paymentService.findAll()
    ]);

    const stats = {
      totalRevenue: payments
        .filter(p => p && (p.Status === 'completed' || p.Status === 'paid' || p.Status === 'confirmed'))
        .reduce((sum, p) => sum + (parseFloat(p.Amount) || 0), 0),

      totalBookings: bookings.length,
      totalCustomers: customers.length,

      pendingBookings: bookings.filter(b =>
        ['requested', 'pending'].includes(b.Status)
      ).length,

      todayBookings: bookings.filter(b => {
        try {
          const bookingDate = new Date(b.Date || b.createdAt || b.created_at);
          const today = new Date();
          return bookingDate.toDateString() === today.toDateString();
        } catch (e) {
          return false;
        }
      }).length
    };

    // Return consistent format with getDashboardStats
    res.json({
      success: true,
      stats: stats // Keep as number, frontend will format
    });

  } catch (error) {
    console.error('❌ Booking stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking statistics'
    });
  }
};

exports.getBookingDetails = async (req, res) => {
  const bookingController = require('./bookingController');
  return bookingController.getBookingById(req, res);
};

exports.updateBooking = async (req, res) => {
  const bookingController = require('./bookingController');
  return bookingController.updateBookingStatus(req, res);
};

exports.deleteBooking = async (req, res) => {
  const bookingController = require('./bookingController');
  return bookingController.deleteBooking(req, res);
};

exports.markAsContacted = async (req, res) => {
  const bookingController = require('./bookingController');
  return bookingController.markAsContacted(req, res);
};

exports.moveToInProgress = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Use updateBookingStatus instead'
  });
};

exports.provideQuotation = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Use updateBookingStatus instead'
  });
};

exports.updateBookingStatus = async (req, res) => {
  const bookingController = require('./bookingController');
  return bookingController.updateBookingStatus(req, res);
};

// ==================== ADMIN PASSWORD RESET ====================

exports.resetAdminPassword = async (req, res) => {
  try {
    const { adminId } = req.params;
    
    // Check if current user is admin
    const currentAdmin = await adminService.findById(req.user.id);
    if (!currentAdmin || currentAdmin.Role !== 'main_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only main administrators can reset admin passwords'
      });
    }

    // Check if target admin exists
    const targetAdmin = await adminService.findById(adminId);
    if (!targetAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Generate a temporary password (8 characters: letters + numbers)
    const generateTempPassword = () => {
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
      let password = '';
      for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const tempPassword = generateTempPassword();
    
    // Update admin password (adminService.update will hash it automatically)
    await adminService.update(adminId, {
      Password: tempPassword,
      PasswordResetRequired: true,
      PasswordResetAt: new Date().toISOString(),
      PasswordResetBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Password reset successfully',
      tempPassword: tempPassword,
      adminName: targetAdmin.Name,
      adminEmail: targetAdmin.Email
    });

  } catch (error) {
    console.error('Error resetting admin password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset admin password'
    });
  }
};

module.exports = exports;
