// serviceController.js - Firebase version
const serviceService = require('../firebase-services/serviceService');
const storageService = require('../firebase-services/storageService');
const path = require('path');

exports.createService = async (req, res) => {
  try {
    const { Name, Description, Duration, Category, Is_Available } = req.body;

    if (!Name || !Duration) {
      return res.status(400).json({ 
        success: false,
        message: 'Name and Duration are required.' 
      });
    }

    let imageUrl = null;
    let imageUploadWarning = null;
    
    if (req.file) {
      try {
        imageUrl = req.firebaseFileUrl || await storageService.uploadFile(
          req.file.buffer,
          req.file.originalname,
          'services'
        );
      } catch (uploadError) {
        console.error('⚠️ Image upload failed, creating service without image:', uploadError.message);
        imageUploadWarning = 'Service created but image upload failed. You can add an image later.';
        // Continue without image instead of failing
      }
    }

    const service = await serviceService.create({ 
      Name, 
      Description, 
      Duration,
      Category,
      Is_Available: Is_Available !== undefined ? Is_Available : true,
      Image_URL: imageUrl
    });

    res.status(201).json({ 
      success: true,
      message: imageUploadWarning || 'Service created successfully', 
      service,
      warning: imageUploadWarning
    });
  } catch (err) {
    console.error('Create service error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error creating service: ' + err.message 
    });
  }
};

exports.getServices = async (req, res) => {
  try {
    const allServices = await serviceService.findAll();
    
    // Sort by creation date (newest first)
    const services = allServices.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
    
    res.json({ 
      success: true,
      services 
    });
  } catch (err) {
    console.error('Get services error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching services: ' + err.message 
    });
  }
};

// Update public services endpoint to show ALL services (not just available ones)
exports.getPublicServices = async (req, res) => {
  try {
    console.log('📋 Fetching ALL public services...');
    
    const allServices = await serviceService.findAll();
    
    // Sort by name
    const services = allServices.sort((a, b) => 
      (a.Name || '').localeCompare(b.Name || '')
    );

    console.log(`✅ Found ${services.length} services total`);

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
};

exports.getServiceById = async (req, res) => {
  const { id } = req.params;
  try {
    const service = await serviceService.findById(id);
    if (!service) {
      return res.status(404).json({ 
        success: false,
        message: 'Service not found.' 
      });
    }
    
    res.json({ 
      success: true,
      service 
    });
  } catch (err) {
    console.error('Get service error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching service: ' + err.message 
    });
  }
};

exports.updateService = async (req, res) => {
  const { id } = req.params;
  const { Name, Description, Duration, Category, Is_Available } = req.body;

  try {
    const service = await serviceService.findById(id);
    if (!service) {
      return res.status(404).json({ 
        success: false,
        message: 'Service not found.' 
      });
    }

    let imageUrl = service.Image_URL;
    let imageUploadWarning = null;
    
    if (req.file) {
      // Delete old image from Firebase Storage
      if (service.Image_URL) {
        try {
          await storageService.deleteFile(service.Image_URL);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      
      try {
        imageUrl = req.firebaseFileUrl || await storageService.uploadFile(
          req.file.buffer,
          req.file.originalname,
          'services'
        );
      } catch (uploadError) {
        console.error('⚠️ Image upload failed during update:', uploadError.message);
        imageUploadWarning = 'Service updated but new image upload failed.';
        // Keep the old image URL
      }
    }

    const updatedService = await serviceService.update(id, {
      Name: Name || service.Name,
      Description: Description !== undefined ? Description : service.Description,
      Duration: Duration != null ? Duration : service.Duration,
      Category: Category !== undefined ? Category : service.Category,
      Is_Available: Is_Available !== undefined ? Is_Available : service.Is_Available,
      Image_URL: imageUrl
    });
    
    res.json({ 
      success: true,
      message: 'Service updated successfully', 
      service: updatedService 
    });
  } catch (err) {
    console.error('Update service error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error updating service: ' + err.message 
    });
  }
};

exports.deleteService = async (req, res) => {
  const { id } = req.params;
  try {
    const service = await serviceService.findById(id);
    if (!service) {
      return res.status(404).json({ 
        success: false,
        message: 'Service not found.' 
      });
    }

    // Delete image from Firebase Storage
    if (service.Image_URL) {
      try {
        await storageService.deleteFile(service.Image_URL);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    await serviceService.delete(id);
    
    res.json({ 
      success: true,
      message: 'Service deleted successfully' 
    });
  } catch (err) {
    console.error('Delete service error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting service: ' + err.message 
    });
  }
};

exports.toggleServiceAvailability = async (req, res) => {
  const { id } = req.params;
  const { isAvailable } = req.body;

  try {
    const service = await serviceService.findById(id);
    if (!service) {
      return res.status(404).json({ 
        success: false,
        message: 'Service not found.' 
      });
    }

    await serviceService.update(id, { Is_Available: isAvailable });
    const updatedService = await serviceService.findById(id);
    
    res.json({ 
      success: true,
      message: `Service ${isAvailable ? 'activated' : 'deactivated'} successfully`,
      service: updatedService 
    });
  } catch (err) {
    console.error('Toggle service availability error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error updating service availability: ' + err.message 
    });
  }
};