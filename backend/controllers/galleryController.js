const galleryService = require('../firebase-services/galleryService');
const storageService = require('../firebase-services/storageService');
const path = require('path');

exports.uploadMedia = async (req, res) => {
  try {
    console.log('🔄 Uploading gallery media...');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { category = 'general' } = req.body;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const mediaType = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(fileExtension) ? 'image' : 'video';

    // Upload to Firebase Storage
    const imageUrl = req.firebaseFileUrl || await storageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      'gallery'
    );

    console.log('📝 Creating gallery record:', {
      filename: req.file.originalname,
      category,
      mediaType,
      url: imageUrl
    });

    const galleryItem = await galleryService.create({
      filename: req.file.originalname,
      category: category.toLowerCase(),
      media_type: mediaType,
      url: imageUrl,
      is_active: true
    });

    console.log('✅ Gallery media uploaded successfully');

    res.json({
      success: true,
      message: 'Media uploaded successfully',
      item: galleryItem
    });

  } catch (error) {
    console.error('❌ Upload media error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading media: ' + error.message
    });
  }
};

// In your gallery controller
exports.getAllMedia = async (req, res) => {
  try {
    const { category } = req.query;
    
    const allMedia = await galleryService.findAll();
    
    // Filter by category and active status
    let media = allMedia.filter(item => item.is_active === true);
    
    if (category && category !== 'all') {
      media = media.filter(item => item.category === category);
    }

    // Sort by upload date (newest first)
    media.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    const mediaWithUrls = media;

    res.json({
      success: true,
      media: mediaWithUrls
    });

  } catch (error) {
    console.error('❌ Get media error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching media'
    });
  }
};

exports.deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;

    const galleryItem = await galleryService.findById(id);
    if (!galleryItem) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    // Delete file from Firebase Storage
    if (galleryItem.url) {
      try {
        await storageService.deleteFile(galleryItem.url);
        console.log('🗑️ Deleted file from Firebase Storage');
      } catch (error) {
        console.error('Error deleting file from storage:', error);
      }
    }

    await galleryService.delete(id);

    res.json({
      success: true,
      message: 'Media deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete media error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting media'
    });
  }
};