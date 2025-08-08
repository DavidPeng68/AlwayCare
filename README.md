# AlwayCare - Kids Protection AI Companion

A comprehensive child-safety web application that uses AI to detect potential hazards in images of children's environments. Upload images and get instant safety analysis with detailed risk assessments.

## 🚀 Features

- **🖼️ Image Upload**: Drag-and-drop interface for easy image upload
- **🤖 AI Analysis**: Computer vision model detects hazardous objects and situations
- **🛡️ Risk Assessment**: Detailed analysis with confidence scores and risk levels
- **🔐 Secure Authentication**: JWT-based authentication with user management
- **📊 Analytics Dashboard**: View analysis statistics and results
- **⚡ Real-time Processing**: Background processing for continuous analysis
- **📱 Responsive Design**: Modern, mobile-friendly interface

## 🎯 Hazard Detection

The system can detect various hazards including:
- **💧 Water hazards**: pools, bathtubs, sinks
- **🔥 Fire hazards**: fire, stoves, candles, lighters
- **✂️ Sharp objects**: knives, scissors, razors
- **⚡ Electrical hazards**: outlets, cords, appliances
- **🏠 Height risks**: stairs, balconies, windows
- **🚗 Traffic hazards**: roads, cars, bicycles
- **💊 Chemical risks**: medicine, cleaning supplies
- **🔘 Choking hazards**: small objects, coins, buttons

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **SQLite** database for data persistence
- **JWT** authentication with bcrypt
- **Multer** for file upload handling
- **Sharp** for image processing
- **Node-schedule** for background processing

### Frontend
- **React 18** with hooks
- **React Router** for navigation
- **React Dropzone** for file uploads
- **Framer Motion** for animations
- **React Icons** for UI icons
- **Axios** for API communication

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd alwaycare
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   npm install
   
   # Install client dependencies
   cd client && npm install && cd ..
   ```

3. **Create environment file**
   ```bash
   # Create .env file in root directory
   echo "PORT=5050
   NODE_ENV=development
   JWT_SECRET=your-secret-key-here
   CLIENT_URL=http://localhost:3000" > .env
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5050

### Demo Account
- **Username**: admin
- **Password**: admin123

## 📖 Usage

1. **Register/Login**: Create an account or use the demo credentials
2. **Upload Images**: Drag and drop images to the dashboard
3. **View Analysis**: Check the Analysis page for detailed results
4. **Monitor Progress**: Track analysis status and risk levels

## 🏗️ Architecture

```
alwaycare/
├── server/                 # Backend server
│   ├── index.js           # Main server file
│   ├── database/          # Database setup
│   ├── routes/            # API routes
│   └── services/          # Business logic
├── client/                # Frontend React app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   └── contexts/      # React contexts
│   └── public/            # Static files
├── uploads/               # Uploaded images
├── data/                  # Database files
└── package.json           # Project configuration
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Images
- `POST /api/images/upload` - Upload image
- `GET /api/images/my-images` - Get user's images
- `DELETE /api/images/:id` - Delete image

### Analysis
- `GET /api/analysis/stats` - Get analysis statistics
- `GET /api/analysis/completed` - Get completed analyses

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- File upload validation
- CORS protection
- Rate limiting
- SQL injection prevention
- XSS protection

## 📊 Database Schema

### Users Table
- id (PRIMARY KEY)
- username (UNIQUE)
- email (UNIQUE)
- password_hash
- created_at, updated_at

### ImageRecords Table
- id (PRIMARY KEY)
- filename, original_filename, file_path
- upload_timestamp
- user_id (FOREIGN KEY)
- analysis_status
- detected_objects (JSON)
- risk_level, risk_description
- confidence_scores (JSON)

## 🎨 UI/UX Features

- **Modern Design**: Clean, friendly interface with soft blues and greens
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Framer Motion for engaging interactions
- **Intuitive Navigation**: Easy-to-use navigation and file upload
- **Real-time Feedback**: Toast notifications and loading states

## 🔄 Background Processing

The application includes continuous background processing:
- Automatic image analysis every 30 seconds
- Queue management for pending images
- Error handling and retry mechanisms
- Processing status tracking

## 📝 Documentation

For detailed setup instructions, see [SETUP.md](SETUP.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions, please create an issue in the repository.

---

**Built with ❤️ for child safety**
