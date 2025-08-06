const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const db = require('../database');
const { analyzeImage } = require('../services/imageAnalysis');

const router = express.Router();

// JWT authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'alwayscare-super-secret-key-change-in-production';

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Upload image
router.post('/upload', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { originalname, filename, path: filepath } = req.file;
    const userId = req.user.id;

    // Validate file size
    const stats = fs.statSync(filepath);
    if (stats.size > 10 * 1024 * 1024) {
      fs.unlinkSync(filepath);
      return res.status(400).json({ error: 'File size too large (max 10MB)' });
    }

    // Create image record in database
    const imageRecord = await db.createImageRecord(userId, filename, filepath, originalname);

    // Process image (resize if needed)
    await processImage(filepath);

    res.status(201).json({
      message: 'Image uploaded successfully',
      image: {
        id: imageRecord.id,
        filename: imageRecord.filename,
        originalName: originalname,
        uploadTime: new Date().toISOString(),
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('❌ Image upload error:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('❌ Error cleaning up file:', cleanupError);
      }
    }

    res.status(500).json({ 
      error: 'Internal server error during image upload' 
    });
  }
});

// Get user's uploaded images
router.get('/my-images', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const images = await db.getImageRecordsByUserId(userId);

    // Format the response
    const formattedImages = images.map(image => ({
      id: image.id,
      filename: image.filename,
      originalName: image.original_filename,
      uploadTime: image.upload_timestamp,
      status: image.status,
      riskLevel: image.risk_level,
      detectedObjects: image.detected_objects ? JSON.parse(image.detected_objects) : [],
      confidenceScores: image.confidence_scores ? JSON.parse(image.confidence_scores) : [],
      analysisResult: image.analysis_result ? JSON.parse(image.analysis_result) : null,
      errorMessage: image.error_message
    }));

    res.json({
      images: formattedImages,
      count: formattedImages.length
    });

  } catch (error) {
    console.error('❌ Error fetching user images:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching images' 
    });
  }
});

// Get specific image details
router.get('/:imageId', authenticateToken, async (req, res) => {
  try {
    const { imageId } = req.params;
    const userId = req.user.id;

    const image = await db.getImageRecordById(imageId);
    
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Check if user owns this image
    if (image.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const formattedImage = {
      id: image.id,
      filename: image.filename,
      originalName: image.original_filename,
      uploadTime: image.upload_timestamp,
      status: image.status,
      riskLevel: image.risk_level,
      detectedObjects: image.detected_objects ? JSON.parse(image.detected_objects) : [],
      confidenceScores: image.confidence_scores ? JSON.parse(image.confidence_scores) : [],
      analysisResult: image.analysis_result ? JSON.parse(image.analysis_result) : null,
      errorMessage: image.error_message,
      imageUrl: `/uploads/${image.filename}`
    };

    res.json({ image: formattedImage });

  } catch (error) {
    console.error('❌ Error fetching image details:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching image details' 
    });
  }
});

// Delete image
router.delete('/:imageId', authenticateToken, async (req, res) => {
  try {
    const { imageId } = req.params;
    const userId = req.user.id;

    const image = await db.getImageRecordById(imageId);
    
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Check if user owns this image
    if (image.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete file from filesystem
    const filepath = path.join(__dirname, '..', 'uploads', image.filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // Delete record from database (you'll need to add this method to database.js)
    // await db.deleteImageRecord(imageId);

    res.json({ message: 'Image deleted successfully' });

  } catch (error) {
    console.error('❌ Error deleting image:', error);
    res.status(500).json({ 
      error: 'Internal server error while deleting image' 
    });
  }
});

// Process image (resize and optimize)
async function processImage(filepath) {
  try {
    const image = sharp(filepath);
    const metadata = await image.metadata();

    // Resize if image is too large (max 1920x1080)
    if (metadata.width > 1920 || metadata.height > 1080) {
      await image
        .resize(1920, 1080, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85 })
        .toFile(filepath + '.processed');
      
      // Replace original with processed version
      fs.renameSync(filepath + '.processed', filepath);
    }
  } catch (error) {
    console.error('❌ Error processing image:', error);
  }
}

module.exports = router;