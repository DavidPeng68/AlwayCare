// API Configuration
const API_CONFIG = {
  development: 'http://localhost:5000',
  production: process.env.REACT_APP_API_BASE_URL || 'https://alwaycare.onrender.com'
};

// Get the current environment
const isDevelopment = process.env.NODE_ENV === 'development';
const API_BASE_URL = isDevelopment ? API_CONFIG.development : API_CONFIG.production;

export default API_BASE_URL;
