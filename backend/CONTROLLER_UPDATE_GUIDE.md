# Controller Update Guide for Firebase

This guide shows you how to update each controller to use Firebase instead of MySQL/Sequelize.

## General Pattern

### Old Pattern (MySQL/Sequelize)
```javascript
const { Customer, Admin, Service } = require('../models');

// Find one
const customer = await Customer.findOne({ where: { Email } });

// Find by ID
const customer = await Customer.findByPk(id);

// Create
const customer = await Customer.create({ Full_Name, Email, Password });

// Update
await customer.update({ Full_Name: newName });

// Delete
await customer.destroy();

// Find all
const customers = await Customer.findAll();
```

### New Pattern (Firebase)
```javascript
const customerService = require('../firebase-services/customerService');
const adminService = require('../firebase-services/adminService');
const serviceService = require('../firebase-services/serviceService');

// Find by email
const customer = await customerService.findByEmail(Email);

// Find by ID
const customer = await customerService.findById(id);

// Create
const customer = await customerService.create({ Full_Name, Email, Password });

// Update
const customer = await customerService.update(id, { Full_Name: newName });

// Delete
await customerService.delete(id);

// Find all
const customers = await customerService.findAll();
```

## Controller-Specific Updates

### 1. authController.js ✅ DONE
Already created as `authController.firebase.js`

To activate:
```bash
mv controllers/authController.js controllers/authController.mysql.backup.js
mv controllers/authController.firebase.js controllers/authController.js
```

### 2. customerController.js

**Changes needed:**
```javascript
// OLD
const { Customer } = require('../models');

// NEW
const customerService = require('../firebase-services/customerService');

// OLD: Get all customers
const customers = await Customer.findAll();

// NEW: Get all customers
const customers = await customerService.findAll();

// OLD: Get customer by ID
const customer = await Customer.findByPk(id);

// NEW: Get customer by ID
const customer = await customerService.findById(id);

// OLD: Update customer
await customer.update(updateData);

// NEW: Update customer
await customerService.update(id, updateData);

// OLD: Delete customer
await customer.destroy();

// NEW: Delete customer
await customerService.delete(id);
```

### 3. adminController.js

**Changes needed:**
```javascript
// OLD
const { Admin } = require('../models');

// NEW
const adminService = require('../firebase-services/adminService');

// OLD: Create admin
const admin = await Admin.create({ Name, Email, Password, Role });

// NEW: Create admin
const admin = await adminService.create({ Full_Name: Name, Email, Password, Role });

// OLD: Find admin
const admin = await Admin.findByPk(id);

// NEW: Find admin
const admin = await adminService.findById(id);

// OLD: Update admin
await admin.update({ Name: newName });

// NEW: Update admin
await adminService.update(id, { Name: newName });
```

### 4. serviceController.js

**Changes needed:**
```javascript
// OLD
const { Service } = require('../models');

// NEW
const serviceService = require('../firebase-services/serviceService');

// OLD: Create service
const service = await Service.create({ Name, Description, Price, Image });

// NEW: Create service
const service = await serviceService.create({ Name, Description, Price, Image });

// OLD: Get all services
const services = await Service.findAll();

// NEW: Get all services
const services = await serviceService.findAll();

// OLD: Update service
await service.update({ Price: newPrice });

// NEW: Update service
await serviceService.update(id, { Price: newPrice });
```

### 5. productController.js

**Changes needed:**
```javascript
// OLD
const { Product } = require('../models');

// NEW
const productService = require('../firebase-services/productService');

// Similar pattern as serviceController
```

### 6. bookingController.js

**Changes needed:**
```javascript
// OLD
const { Booking, Customer, Service } = require('../models');

// NEW
const bookingService = require('../firebase-services/bookingService');
const customerService = require('../firebase-services/customerService');
const serviceService = require('../firebase-services/serviceService');

// OLD: Get bookings with associations
const bookings = await Booking.findAll({
  include: [
    { model: Customer },
    { model: Service }
  ]
});

// NEW: Get bookings and populate manually
const bookings = await bookingService.findAll();
for (let booking of bookings) {
  if (booking.Customer_ID) {
    booking.Customer = await customerService.findById(booking.Customer_ID);
  }
  if (booking.Service_ID) {
    booking.Service = await serviceService.findById(booking.Service_ID);
  }
}
```

### 7. orderController.js

**Changes needed:**
```javascript
// OLD
const { Order, Customer, Product } = require('../models');

// NEW
const orderService = require('../firebase-services/orderService');
const customerService = require('../firebase-services/customerService');
const productService = require('../firebase-services/productService');

// Similar pattern as bookingController
```

### 8. paymentController.js

**Changes needed:**
```javascript
// OLD
const { Payment, Booking } = require('../models');

// NEW
const paymentService = require('../firebase-services/paymentService');
const bookingService = require('../firebase-services/bookingService');
```

### 9. galleryController.js

**Changes needed:**
```javascript
// OLD
const { Gallery } = require('../models');

// NEW
const galleryService = require('../firebase-services/galleryService');
```

## File Upload Updates

### Old Pattern (Local Storage)
```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/upload/products');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// In controller
const imageUrl = `/upload/products/${req.file.filename}`;
```

### New Pattern (Firebase Storage)
```javascript
const multer = require('multer');
const storageService = require('../firebase-services/storageService');

const upload = multer({ storage: multer.memoryStorage() });

// In controller
const imageUrl = await storageService.uploadFile(
  req.file.buffer,
  req.file.originalname,
  'products'
);
```

## Step-by-Step Migration Process

### 1. Backup Current Controllers
```bash
cd backend/controllers
mkdir backup
cp *.js backup/
```

### 2. Update One Controller at a Time
Start with the simplest ones first:
1. galleryController.js
2. serviceController.js
3. productController.js
4. customerController.js
5. adminController.js
6. paymentController.js
7. bookingController.js
8. orderController.js

### 3. Test After Each Update
```bash
# Start server
pnpm run dev

# Test the updated endpoints
curl http://localhost:5000/api/services
curl http://localhost:5000/api/products
```

### 4. Update File Upload Middleware
Create a new file `middleware/firebaseUpload.js`:

```javascript
const multer = require('multer');
const storageService = require('../firebase-services/storageService');

// Use memory storage instead of disk storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Middleware to upload to Firebase Storage
const uploadToFirebase = (folder) => async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const imageUrl = await storageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      folder
    );

    req.firebaseFileUrl = imageUrl;
    next();
  } catch (error) {
    console.error('Firebase upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file'
    });
  }
};

module.exports = { upload, uploadToFirebase };
```

### 5. Update Routes to Use New Upload Middleware
```javascript
// OLD
const upload = require('../middleware/upload');
router.post('/products', upload.single('image'), productController.create);

// NEW
const { upload, uploadToFirebase } = require('../middleware/firebaseUpload');
router.post('/products', 
  upload.single('image'), 
  uploadToFirebase('products'),
  productController.create
);
```

## Common Issues and Solutions

### Issue: "Cannot read property 'ID' of null"
**Solution**: Firebase returns `null` instead of throwing an error when a document doesn't exist. Always check:
```javascript
const customer = await customerService.findById(id);
if (!customer) {
  return res.status(404).json({ message: 'Customer not found' });
}
```

### Issue: "Document IDs are strings, not numbers"
**Solution**: Firebase generates string IDs. Update your code to handle strings:
```javascript
// OLD
const customerId = parseInt(req.params.id);

// NEW
const customerId = req.params.id; // Keep as string
```

### Issue: "Associations don't work"
**Solution**: Manually populate related data:
```javascript
const booking = await bookingService.findById(id);
if (booking.Customer_ID) {
  booking.Customer = await customerService.findById(booking.Customer_ID);
}
```

## Testing Checklist

After updating each controller, test:

- ✅ Create (POST)
- ✅ Read all (GET)
- ✅ Read one (GET /:id)
- ✅ Update (PUT /:id)
- ✅ Delete (DELETE /:id)
- ✅ File uploads (if applicable)
- ✅ Relationships/associations (if applicable)

## Rollback Instructions

If something goes wrong:

```bash
# Restore from backup
cd backend/controllers
cp backup/*.js .

# Reinstall MySQL dependencies
pnpm add mysql2 sequelize

# Revert server.js changes
git checkout server.js
```

---

**Tip**: Update and test one controller at a time. Don't try to update everything at once!
