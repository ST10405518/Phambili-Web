const multer = require('multer');
const storageService = require('../firebase-services/storageService');

// Use memory storage instead of disk storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for gallery videos, 10MB should be enough for images
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos for gallery, images only for other uploads
    const isGalleryUpload = req.originalUrl.includes('/gallery');
    
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/avi', 'video/mov', 'video/wmv'];
    
    if (isGalleryUpload) {
      // Gallery allows both images and videos
      const allAllowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
      if (!allAllowedTypes.includes(file.mimetype)) {
        return cb(new Error('Only image files (JPEG, PNG, GIF, WebP) and video files (MP4, MOV, AVI, WMV) are allowed for gallery!'), false);
      }
    } else {
      // Other uploads only allow images
      if (!allowedImageTypes.includes(file.mimetype)) {
        return cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed!'), false);
      }
    }
    cb(null, true);
  }
});

/**
 * Middleware to upload a single file to Firebase Storage
 * @param {string} folder - The folder to upload to (e.g., 'products', 'services', 'general')
 * @returns {Function} Express middleware function
 */
const uploadToFirebase = (folder = 'general') => async (req, res, next) => {
  try {
    if (!req.file) {
      // No file uploaded, continue to next middleware
      return next();
    }

    console.log(`📤 Uploading file to Firebase Storage: ${req.file.originalname}`);

    // Upload file to Firebase Storage
    const imageUrl = await storageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      folder
    );

    console.log(`✅ File uploaded successfully: ${imageUrl}`);

    // Attach the Firebase URL to the request object
    req.firebaseFileUrl = imageUrl;
    
    // Also add it to req.file for compatibility
    req.file.firebaseUrl = imageUrl;

    next();
  } catch (error) {
    console.error('❌ Firebase upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file to Firebase Storage',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Middleware to upload multiple files to Firebase Storage
 * @param {string} folder - The folder to upload to
 * @returns {Function} Express middleware function
 */
const uploadMultipleToFirebase = (folder = 'general') => async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      // No files uploaded, continue to next middleware
      return next();
    }

    console.log(`📤 Uploading ${req.files.length} files to Firebase Storage`);

    // Upload all files in parallel
    const uploadPromises = req.files.map(file =>
      storageService.uploadFile(file.buffer, file.originalname, folder)
    );

    const imageUrls = await Promise.all(uploadPromises);

    console.log(`✅ ${imageUrls.length} files uploaded successfully`);

    // Attach the Firebase URLs to the request object
    req.firebaseFileUrls = imageUrls;
    
    // Also add URLs to each file object
    req.files.forEach((file, index) => {
      file.firebaseUrl = imageUrls[index];
    });

    next();
  } catch (error) {
    console.error('❌ Firebase multiple upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading files to Firebase Storage',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Middleware to delete a file from Firebase Storage
 * @param {string} fileUrl - The URL of the file to delete
 */
const deleteFromFirebase = async (fileUrl) => {
  try {
    if (!fileUrl) {
      return;
    }

    console.log(`🗑️ Deleting file from Firebase Storage: ${fileUrl}`);
    await storageService.deleteFile(fileUrl);
    console.log(`✅ File deleted successfully`);
  } catch (error) {
    console.error('❌ Firebase delete error:', error);
    // Don't throw error, just log it
  }
};

module.exports = {
  upload,
  uploadToFirebase,
  uploadMultipleToFirebase,
  deleteFromFirebase
};
