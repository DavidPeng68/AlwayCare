# AlwayCare Setup Instructions

## Overview
AlwayCare is a child-safety web application that uses AI to detect potential hazards in images of children's environments. The application features image upload, computer vision analysis, and detailed risk assessment.

## Features
- **Frontend**: Modern React application with drag-and-drop image upload
- **Backend**: Node.js/Express server with secure authentication
- **Database**: SQLite database for user and image management
- **Image Analysis**: Simulated computer vision model for hazard detection
- **Security**: JWT authentication and secure file handling
- **Continuous Operation**: Background processing for image analysis

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd alwaycare
```

### 2. Install dependencies
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=5050
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-secret-key-here

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000

# Database Configuration
DATABASE_URL=./data/alwaycare.db
```

### 4. Start the application
```bash
# Start both server and client
npm start

# Or start them separately:
# Terminal 1 - Start server
npm run server

# Terminal 2 - Start client
npm run client
```

## Usage

### 1. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5050

### 2. Demo Account
You can use the default demo account:
- **Username**: admin
- **Password**: admin123

### 3. Upload Images
1. Log in to your account
2. Navigate to the Dashboard
3. Drag and drop images or click to browse
4. Images will be automatically analyzed for hazards

### 4. View Analysis Results
- Check the Analysis page for detailed results
- View risk levels and detected objects
- See confidence scores for each detection

## Technical Details

### Backend Architecture
- **Server**: Express.js with middleware for security
- **Database**: SQLite with user and image tables
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Upload**: Multer middleware with validation
- **Image Processing**: Sharp library for image manipulation
- **Background Processing**: Node-schedule for continuous analysis

### Frontend Architecture
- **Framework**: React 18 with hooks
- **Routing**: React Router for navigation
- **State Management**: Context API for authentication
- **UI Components**: Custom components with modern design
- **File Upload**: React Dropzone for drag-and-drop
- **Animations**: Framer Motion for smooth transitions

### Image Analysis
The application simulates computer vision analysis by:
1. Processing uploaded images with Sharp
2. Simulating object detection based on image characteristics
3. Analyzing risks based on detected objects
4. Providing confidence scores and risk levels

### Hazard Detection
The system can detect various hazards:
- **Water hazards**: pools, bathtubs, sinks
- **Fire hazards**: fire, stoves, candles, lighters
- **Sharp objects**: knives, scissors, razors
- **Electrical hazards**: outlets, cords, appliances
- **Height risks**: stairs, balconies, windows
- **Traffic hazards**: roads, cars, bicycles
- **Chemical risks**: medicine, cleaning supplies
- **Choking hazards**: small objects, coins, buttons

## Security Features
- JWT token authentication
- Password hashing with bcrypt
- File upload validation and sanitization
- CORS protection
- Rate limiting
- Helmet security headers
- SQL injection prevention

## Database Schema

### Users Table
- id (PRIMARY KEY)
- username (UNIQUE)
- email (UNIQUE)
- password_hash
- created_at
- updated_at

### ImageRecords Table
- id (PRIMARY KEY)
- filename
- original_filename
- file_path
- upload_timestamp
- user_id (FOREIGN KEY)
- analysis_status
- detected_objects (JSON)
- risk_level
- risk_description
- confidence_scores (JSON)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/verify` - Verify JWT token

### Images
- `POST /api/images/upload` - Upload image
- `GET /api/images/my-images` - Get user's images
- `GET /api/images/:id` - Get specific image
- `DELETE /api/images/:id` - Delete image

### Analysis
- `GET /api/analysis/status/:id` - Get analysis status
- `POST /api/analysis/trigger/:id` - Manually trigger analysis
- `GET /api/analysis/stats` - Get analysis statistics
- `GET /api/analysis/completed` - Get completed analyses

## Development

### Project Structure
```
alwaycare/
├── server/
│   ├── index.js              # Main server file
│   ├── database/
│   │   └── database.js       # Database setup and utilities
│   ├── routes/
│   │   ├── auth.js           # Authentication routes
│   │   ├── images.js         # Image upload routes
│   │   └── analysis.js       # Analysis routes
│   └── services/
│       ├── imageAnalysis.js  # Image processing service
│       └── backgroundProcessor.js # Background processing
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   └── App.js          # Main app component
│   └── package.json
├── uploads/                 # Uploaded images
├── data/                   # Database files
└── package.json
```

### Running in Development
```bash
# Start with hot reload
npm run dev

# Start server with nodemon
npm run server:dev

# Start client only
cd client && npm start
```

### Building for Production
```bash
# Build client
cd client && npm run build

# Start production server
NODE_ENV=production npm start
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change PORT in .env file
   - Kill existing processes on the port

2. **Database errors**
   - Delete `data/alwaycare.db` and restart
   - Check file permissions

3. **Image upload fails**
   - Ensure uploads directory exists
   - Check file size limits (10MB)
   - Verify file format (JPG, PNG, GIF, WEBP)

4. **Authentication issues**
   - Clear browser localStorage
   - Check JWT_SECRET in .env
   - Restart server

### Logs
- Server logs appear in the terminal
- Check browser console for frontend errors
- Database queries are logged to console

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License
MIT License - see LICENSE file for details

## Support
For issues and questions, please create an issue in the repository.
