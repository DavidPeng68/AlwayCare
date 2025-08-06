const express = require('express');
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

// Get analysis results for a specific image
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

    // Parse analysis results
    let analysisResult = null;
    if (image.analysis_result) {
      try {
        analysisResult = JSON.parse(image.analysis_result);
      } catch (parseError) {
        console.error('❌ Error parsing analysis result:', parseError);
      }
    }

    const response = {
      imageId: image.id,
      status: image.status,
      riskLevel: image.risk_level,
      detectedObjects: image.detected_objects ? JSON.parse(image.detected_objects) : [],
      confidenceScores: image.confidence_scores ? JSON.parse(image.confidence_scores) : [],
      warnings: analysisResult?.warnings || [],
      metadata: analysisResult?.metadata || null,
      timestamp: image.upload_timestamp,
      errorMessage: image.error_message
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Error fetching analysis results:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching analysis results' 
    });
  }
});

// Trigger manual analysis for an image
router.post('/:imageId/analyze', authenticateToken, async (req, res) => {
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

    // Check if image is already being processed
    if (image.status === 'processing') {
      return res.status(409).json({ 
        error: 'Image is already being processed' 
      });
    }

    // Update status to processing
    await db.updateImageAnalysis(imageId, { status: 'processing' });

    // Start analysis in background
    analyzeImageInBackground(imageId, image.filepath);

    res.json({
      message: 'Analysis started',
      imageId: image.id,
      status: 'processing'
    });

  } catch (error) {
    console.error('❌ Error starting analysis:', error);
    res.status(500).json({ 
      error: 'Internal server error while starting analysis' 
    });
  }
});

// Get analysis statistics for user
router.get('/stats/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const images = await db.getImageRecordsByUserId(userId);

    const stats = {
      totalImages: images.length,
      analyzedImages: images.filter(img => img.status === 'completed').length,
      pendingImages: images.filter(img => img.status === 'pending').length,
      failedImages: images.filter(img => img.status === 'failed').length,
      riskLevels: {
        low: images.filter(img => img.risk_level === 'low').length,
        medium: images.filter(img => img.risk_level === 'medium').length,
        high: images.filter(img => img.risk_level === 'high').length,
        critical: images.filter(img => img.risk_level === 'critical').length
      },
      recentActivity: images
        .sort((a, b) => new Date(b.upload_timestamp) - new Date(a.upload_timestamp))
        .slice(0, 5)
        .map(img => ({
          id: img.id,
          filename: img.filename,
          status: img.status,
          riskLevel: img.risk_level,
          uploadTime: img.upload_timestamp
        }))
    };

    res.json(stats);

  } catch (error) {
    console.error('❌ Error fetching analysis stats:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching analysis statistics' 
    });
  }
});

// Get all analysis results for user
router.get('/user/all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const images = await db.getImageRecordsByUserId(userId);

    const analysisResults = images.map(image => {
      let analysisResult = null;
      if (image.analysis_result) {
        try {
          analysisResult = JSON.parse(image.analysis_result);
        } catch (parseError) {
          console.error('❌ Error parsing analysis result:', parseError);
        }
      }

      return {
        id: image.id,
        filename: image.filename,
        originalName: image.original_filename,
        status: image.status,
        riskLevel: image.risk_level,
        detectedObjects: image.detected_objects ? JSON.parse(image.detected_objects) : [],
        confidenceScores: image.confidence_scores ? JSON.parse(image.confidence_scores) : [],
        warnings: analysisResult?.warnings || [],
        uploadTime: image.upload_timestamp,
        errorMessage: image.error_message
      };
    });

    res.json({
      results: analysisResults,
      count: analysisResults.length
    });

  } catch (error) {
    console.error('❌ Error fetching all analysis results:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching analysis results' 
    });
  }
});

// Background analysis function
async function analyzeImageInBackground(imageId, filepath) {
  try {
    console.log(`🔍 Starting background analysis for image ${imageId}`);
    
    // Update status to processing
    await db.updateImageAnalysis(imageId, { status: 'processing' });

    // Perform analysis
    const analysisResult = await analyzeImage(filepath);

    // Update database with results
    await db.updateImageAnalysis(imageId, {
      ...analysisResult,
      status: 'completed'
    });

    console.log(`✅ Background analysis completed for image ${imageId}`);

  } catch (error) {
    console.error(`❌ Background analysis failed for image ${imageId}:`, error);
    
    // Update database with error
    await db.updateImageAnalysis(imageId, {
      error: error.message,
      status: 'failed'
    });
  }
}

module.exports = router;