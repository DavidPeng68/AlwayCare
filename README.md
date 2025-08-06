# AlwaysCare - Child Safety AI Companion

AlwaysCare is a comprehensive web application that uses AI-powered computer vision to detect potential safety hazards in images of children and environments. The application provides real-time analysis, risk assessment, and safety recommendations to help protect children.

## 🚀 Features

### Core Functionality
- **AI-Powered Image Analysis**: Advanced computer vision technology detects hazardous objects and situations
- **Real-time Risk Assessment**: Instant detection of dangers like water, fire, weapons, roadways, etc.
- **Comprehensive Safety Warnings**: Detailed alerts with specific risk levels and recommendations
- **User Authentication**: Secure JWT-based authentication system
- **Image Management**: Upload, store, and manage images with analysis history
- **Background Processing**: Continuous analysis of uploaded images
- **Responsive Design**: Modern, child-friendly interface that works on all devices

### Safety Detection Categories
- **High Risk**: Water, fire, weapons, sharp objects, chemicals
- **Medium Risk**: Roads, vehicles, stairs, windows, electrical outlets
- **Low Risk**: General household items, toys, furniture

## 🏗️ Architecture

### Frontend (React)
- **React 18** with functional components and hooks
- **React Router** for navigation
- **Axios** for API communication
- **React Dropzone** for file uploads
- **React Hot Toast** for notifications
- **Lucide React** for icons
- **Modern CSS** with CSS variables and responsive design

### Backend (Node.js/Express)
- **Express.js** server with RESTful API
- **SQLite** database for data persistence
- **JWT** authentication with bcrypt password hashing
- **Multer** for file upload handling
- **Sharp** for image processing
- **Node-schedule** for background jobs
- **Helmet** and **CORS** for security

### AI/Computer Vision
- **Simulated YOLO-like Detection**: Custom object detection system
- **Risk Level Classification**: Automatic risk assessment
- **Confidence Scoring**: Probability-based detection results
- **Warning Generation**: Context-aware safety alerts

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd alwayscare-child-safety
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server && npm install
   
   # Install client dependencies
   cd ../client && npm install
   
   # Return to root
   cd ..
   ```

3. **Start the application**
   ```bash
   # Start both frontend and backend
   npm start
   ```

   This will start:
   - Backend server on `http://localhost:5000`
   - Frontend development server on `http://localhost:3000`

### Alternative Installation

You can also install all dependencies at once using the provided script:

```bash
npm run install:all
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret (change in production)
JWT_SECRET=your-super-secret-jwt-key

# Database Configuration
DB_PATH=./alwayscare.db
```

### Database Setup

The application automatically creates the SQLite database and tables on first run. The database file will be created at `server/alwayscare.db`.

## 🎯 Usage

### Getting Started

1. **Register an Account**
   - Navigate to the registration page
   - Create a new account with username, email, and password

2. **Upload Images**
   - Use the drag-and-drop interface to upload images
   - Supported formats: JPEG, PNG, GIF, WebP
   - Maximum file size: 10MB

3. **View Analysis Results**
   - Real-time analysis with risk level assessment
   - Detailed safety warnings and recommendations
   - Object detection with confidence scores

4. **Monitor Dashboard**
   - View statistics and analysis history
   - Track risk levels across all uploaded images
   - Manage your image library

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

#### Images
- `POST /api/images/upload` - Upload image
- `GET /api/images/my-images` - Get user's images
- `GET /api/images/:imageId` - Get specific image details
- `DELETE /api/images/:imageId` - Delete image

#### Analysis
- `GET /api/analysis/:imageId` - Get analysis results
- `POST /api/analysis/:imageId/analyze` - Trigger manual analysis
- `GET /api/analysis/stats/user` - Get user statistics
- `GET /api/analysis/user/all` - Get all analysis results

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Comprehensive form and file validation
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Cross-origin resource sharing configuration
- **Helmet Security**: Security headers and middleware
- **File Upload Security**: File type and size validation

## 🎨 Design System

### Color Palette
- **Primary Blue**: #4A90E2 (Trust, safety)
- **Primary Green**: #7ED321 (Success, low risk)
- **Accent Orange**: #FF9800 (Warning, medium risk)
- **Accent Red**: #F44336 (Danger, high risk)
- **Light Blue**: #E3F2FD (Background, soft)
- **Light Green**: #E8F5E8 (Background, soft)

### Typography
- **Font Family**: Segoe UI, Tahoma, Geneva, Verdana, sans-serif
- **Font Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Components
- **Cards**: Rounded corners with subtle shadows
- **Buttons**: Gradient backgrounds with hover effects
- **Forms**: Clean inputs with focus states
- **Alerts**: Color-coded warning and success messages

## 🔄 Background Processing

The application uses a scheduled background job that runs every 30 seconds to process pending images:

```javascript
// Background job for processing pending images
const processPendingImages = async () => {
  // Fetch pending images from database
  // Process each image with AI analysis
  // Update database with results
};

// Schedule job to run every 30 seconds
schedule.scheduleJob('*/30 * * * * *', processPendingImages);
```

## 🧪 AI Integration

### Current Implementation
The application currently uses a simulated YOLO-like object detection system that:

1. **Simulates Processing Time**: 1-3 seconds per image
2. **Detects Common Hazards**: Water, fire, weapons, roads, vehicles, etc.
3. **Calculates Risk Levels**: Low, medium, high, critical
4. **Generates Warnings**: Context-aware safety messages

### Future Enhancements
To integrate with a real YOLO model:

1. **Install YOLOv8**:
   ```bash
   npm install @ultralytics/yolov8
   ```

2. **Update Image Analysis Service**:
   ```javascript
   const { YOLO } = require('@ultralytics/yolov8');
   
   const model = new YOLO('yolov8n.pt');
   
   async function analyzeImage(imagePath) {
     const results = await model.predict(imagePath);
     return processResults(results);
   }
   ```

3. **Configure Model Classes**: Map YOLO classes to safety categories

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Image Records Table
```sql
CREATE TABLE image_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  upload_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  detected_objects TEXT,
  confidence_scores TEXT,
  risk_level TEXT DEFAULT 'low',
  status TEXT DEFAULT 'pending',
  analysis_result TEXT,
  error_message TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## 🚀 Deployment

### Production Setup

1. **Build the Frontend**:
   ```bash
   cd client
   npm run build
   ```

2. **Configure Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=your-production-jwt-secret
   ```

3. **Start the Server**:
   ```bash
   cd server
   npm start
   ```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN cd client && npm install && npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## 🔮 Roadmap

- [ ] Real YOLO model integration
- [ ] Mobile app development
- [ ] Real-time video analysis
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Integration with emergency services
- [ ] Machine learning model training
- [ ] API rate limiting improvements
- [ ] Enhanced security features

---

**AlwaysCare** - Protecting children with AI-powered safety detection.
