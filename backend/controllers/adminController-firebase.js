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
    console.log('📊 Fetching dashboard statistics...');

    // Get all data in parallel
    const [bookings, customers, services, products, orders, payments] = await Promise.all([
      bookingService.findAll(),
      customerService.findAll(),
      serviceService.findAll(),
      productService.findAll(),
      orderService.findAll(),
      paymentService.findAll()
    ]);

    // Calculate statistics
    const stats = {
      totalBookings: bookings.length,
      totalCustomers: customers.length,
      totalServices: services.length,
      totalProducts: products.length,
      totalOrders: orders.length,
      
      // Booking status breakdown
      bookingsByStatus: {
        requested: bookings.filter(b => b.Status === 'requested').length,
        contacted: bookings.filter(b => b.Status === 'contacted').length,
        in_progress: bookings.filter(b => b.Status === 'in_progress').length,
        quoted: bookings.filter(b => b.Status === 'quoted').length,
        confirmed: bookings.filter(b => b.Status === 'confirmed').length,
        completed: bookings.filter(b => b.Status === 'completed').length,
        cancelled: bookings.filter(b => b.Status === 'cancelled').length
      },
      
      // Recent bookings (last 5)
      recentBookings: bookings
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5),
      
      // Revenue calculation
      totalRevenue: payments
        .filter(p => p.Status === 'completed' || p.Status === 'confirmed')
        .reduce((sum, p) => sum + (parseFloat(p.Amount) || 0), 0),
      
      // Pending revenue (quoted but not paid)
      pendingRevenue: bookings
        .filter(b => b.Status === 'quoted' && b.Quoted_Amount)
        .reduce((sum, b) => sum + (parseFloat(b.Quoted_Amount) || 0), 0)
    };

    console.log('✅ Dashboard stats calculated:', stats);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
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
        console.log('Could not delete service image:', err.message);
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
    const { Is_Available } = req.body;

    const service = await serviceService.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    await serviceService.update(id, { Is_Available });

    res.json({
      success: true,
      message: `Service ${Is_Available ? 'enabled' : 'disabled'} successfully`
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
        console.log('Could not delete product image:', err.message);
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
        console.log('Could not delete media file:', err.message);
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

module.exports = exports;
