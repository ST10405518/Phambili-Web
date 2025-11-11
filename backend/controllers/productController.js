const productService = require('../firebase-services/productService');
const storageService = require('../firebase-services/storageService');
const path = require('path');

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    const { Name, Description, Price, Stock_Quantity, Category, Is_Available } = req.body;

    if (!Name || !Price) {
      return res.status(400).json({ 
        success: false,
        message: 'Name and Price are required.' 
      });
    }

    // Handle image upload
    let imageUrl = null;
    if (req.file) {
      imageUrl = req.firebaseFileUrl || await storageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        'products'
      );
    }

    const product = await productService.create({ 
      Name, 
      Description, 
      Price, 
      Stock_Quantity: Stock_Quantity || 0,
      Category,
      Is_Available: Is_Available !== undefined ? Is_Available : true,
      Image_URL: imageUrl
    });

    res.status(201).json({ 
      success: true,
      message: 'Product created successfully', 
      product 
    });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error creating product: ' + err.message 
    });
  }
};

// Get all products
// In controllers/productController.js - update getProducts method
exports.getProducts = async (req, res) => {
  try {
    const allProducts = await productService.findAll();
    
    // Sort by creation date (newest first)
    const productsWithFullUrls = allProducts.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
    
    res.json({ 
      success: true,
      products: productsWithFullUrls
    });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching products: ' + err.message 
    });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await productService.findById(id);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found.' 
      });
    }
    
    res.json({ 
      success: true,
      product 
    });
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching product: ' + err.message 
    });
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { Name, Description, Price, Stock_Quantity, Category, Is_Available } = req.body;

  try {
    const product = await productService.findById(id);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found.' 
      });
    }

    // Handle image upload
    let imageUrl = product.Image_URL;
    if (req.file) {
      // Delete old image from Firebase Storage
      if (product.Image_URL) {
        try {
          await storageService.deleteFile(product.Image_URL);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      imageUrl = req.firebaseFileUrl || await storageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        'products'
      );
    }

    const updatedProduct = await productService.update(id, {
      Name: Name || product.Name,
      Description: Description !== undefined ? Description : product.Description,
      Price: Price != null ? Price : product.Price,
      Stock_Quantity: Stock_Quantity !== undefined ? Stock_Quantity : product.Stock_Quantity,
      Category: Category !== undefined ? Category : product.Category,
      Is_Available: Is_Available !== undefined ? Is_Available : product.Is_Available,
      Image_URL: imageUrl
    });
    
    res.json({ 
      success: true,
      message: 'Product updated successfully', 
      product: updatedProduct 
    });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error updating product: ' + err.message 
    });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await productService.findById(id);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found.' 
      });
    }

    // Delete image from Firebase Storage
    if (product.Image_URL) {
      try {
        await storageService.deleteFile(product.Image_URL);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    await productService.delete(id);
    
    res.json({ 
      success: true,
      message: 'Product deleted successfully' 
    });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting product: ' + err.message 
    });
  }
};

// Toggle product availability
exports.toggleProductAvailability = async (req, res) => {
  const { id } = req.params;
  const { isAvailable } = req.body;

  try {
    const product = await productService.findById(id);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found.' 
      });
    }

    await productService.update(id, { Is_Available: isAvailable });
    const updatedProduct = await productService.findById(id);
    
    res.json({ 
      success: true,
      message: `Product ${isAvailable ? 'activated' : 'deactivated'} successfully`,
      product: updatedProduct 
    });
  } catch (err) {
    console.error('Toggle product availability error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error updating product availability: ' + err.message 
    });
  }
};