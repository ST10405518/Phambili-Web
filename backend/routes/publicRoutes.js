// routes/publicRoutes.js - Firebase version
const express = require('express');
const router = express.Router();
const serviceService = require('../firebase-services/serviceService');
const productService = require('../firebase-services/productService');

// ==================== PUBLIC SERVICES ====================

// Get all available services (public - no auth required)
router.get('/services', async (req, res) => {
  try {
    console.log('📋 Fetching public services...');
    
    const allServices = await serviceService.findAll();
    
    // Filter available services
    const services = allServices.filter(s => s.Is_Available === true);
    
    // Sort by name
    services.sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));

    console.log(`✅ Found ${services.length} public services`);

    res.json({
      success: true,
      services: services.map(service => ({
        ID: service.ID,
        Name: service.Name,
        Description: service.Description,
        Duration: service.Duration,
        Category: service.Category,
        Is_Available: service.Is_Available,
        Image_URL: service.Image_URL,
        Created_At: service.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching public services:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching services'
    });
  }
});

// Get single service details (public)
router.get('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await serviceService.findById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      service: {
        ID: service.ID,
        Name: service.Name,
        Description: service.Description,
        Duration: service.Duration,
        Category: service.Category,
        Is_Available: service.Is_Available,
        Image_URL: service.Image_URL,
        Created_At: service.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching service details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching service details'
    });
  }
});

// ==================== PUBLIC PRODUCTS ====================

// Get all available products (public - no auth required)
router.get('/products', async (req, res) => {
  try {
    console.log('📦 Fetching public products...');
    
    const allProducts = await productService.findAll();
    
    // Filter available products
    const products = allProducts.filter(p => p.Is_Available === true);
    
    // Sort by name
    products.sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));

    console.log(`✅ Found ${products.length} public products`);

    res.json({
      success: false,
      products: products.map(product => ({
        ID: product.ID,
        Name: product.Name,
        Description: product.Description,
        Price: product.Price,
        Stock_Quantity: product.Stock_Quantity,
        Category: product.Category,
        Is_Available: product.Is_Available,
        Image_URL: product.Image_URL,
        Created_At: product.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching public products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});

// Get single product details (public)
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await productService.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product: {
        ID: product.ID,
        Name: product.Name,
        Description: product.Description,
        Price: product.Price,
        Stock_Quantity: product.Stock_Quantity,
        Category: product.Category,
        Is_Available: product.Is_Available,
        Image_URL: product.Image_URL,
        Created_At: product.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product details'
    });
  }
});

module.exports = router;