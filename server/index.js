const express = require('express');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const schedule = require('node-schedule');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

// Import our modules
const db = require('./database');
const authRoutes = require('./routes/auth');
const imageRoutes = require('./routes/images');
const analysisRoutes = require('./routes/analysis');
const { analyzeImage } = require('./services/imageAnalysis');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Database initialization
db.init();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/analysis', analysisRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'AlwaysCare Child Safety API'
  });
});

// Background job for processing pending images
const processPendingImages = async () => {
  try {
    console.log('🔄 Processing pending images...');
    const pendingImages = await db.getPendingImages();
    
    for (const image of pendingImages) {
      try {
        console.log(`Processing image: ${image.filename}`);
        const analysisResult = await analyzeImage(image.filepath);
        
        // Update database with analysis results
        await db.updateImageAnalysis(image.id, analysisResult);
        
        console.log(`✅ Successfully processed image: ${image.filename}`);
      } catch (error) {
        console.error(`❌ Error processing image ${image.filename}:`, error);
        await db.updateImageAnalysis(image.id, { 
          error: error.message,
          status: 'failed'
        });
      }
    }
  } catch (error) {
    console.error('❌ Error in background image processing:', error);
  }
};

// Schedule background job to run every 30 seconds
const backgroundJob = schedule.scheduleJob('*/30 * * * * *', processPendingImages);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  backgroundJob.cancel();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  backgroundJob.cancel();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 AlwaysCare Child Safety Server running on port ${PORT}`);
  console.log(`📊 Background image processing scheduled every 30 seconds`);
  console.log(`🔒 Security features: Helmet, CORS, Rate Limiting enabled`);
});