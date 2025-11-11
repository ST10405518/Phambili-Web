// productRoutes.js - FIXED VERSION
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const productController = require('../controllers/productController');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { upload, uploadToFirebase } = require('../middleware/firebaseUpload');
const productService = require('../firebase-services/productService');

// ==================== PUBLIC ROUTES ====================
router.get('/public/products', async (req, res) => {
  try {
    console.log('📋 Fetching public products...');
    
    const allProducts = await productService.findAll();
    const products = allProducts.filter(p => p.Is_Available === true);
    
    // Sort by creation date (newest first)
    products.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
    
    console.log(`✅ Found ${products.length} available products`);
    
    const productsWithFullUrls = products;
    
    res.json({ 
      success: true,
      products: productsWithFullUrls
    });
  } catch (err) {
    console.error('❌ Public products error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching products' 
    });
  }
});

// Get single product details (public)
router.get('/public/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Fetching public product details for ID: ${id}`);

    const product = await productService.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const productData = product;

    console.log(`✅ Found product: ${productData.Name}`);
    
    res.json({
      success: true,
      product: productData
    });

  } catch (error) {
    console.error('❌ Error fetching product details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product details'
    });
  }
});

// ==================== PROTECTED ROUTES ====================
router.use(auth);

router.post(
  '/',
  upload.single('image'),
  uploadToFirebase('products'),
  [
    body('Name').notEmpty().withMessage('Product name is required'),
    body('Price').isDecimal({ min: 0 }).withMessage('Price must be a positive number'),
    body('Stock_Quantity').isInt({ min: 0 }).withMessage('Stock quantity must be a positive number')
  ],
  validate,
  productController.createProduct
);

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', upload.single('image'), uploadToFirebase('products'), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.patch('/:id/availability', [
  body('isAvailable').isBoolean()
], validate, productController.toggleProductAvailability);

module.exports = router;