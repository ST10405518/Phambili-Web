const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const adminAuth = require('../middleware/adminAuth');
const { upload, uploadToFirebase } = require('../middleware/firebaseUpload');

// Public routes
router.get('/media', galleryController.getAllMedia);

// Admin routes
router.post('/upload', adminAuth, upload.single('media'), uploadToFirebase('gallery'), galleryController.uploadMedia);
router.delete('/media/:id', adminAuth, galleryController.deleteMedia);

module.exports = router;