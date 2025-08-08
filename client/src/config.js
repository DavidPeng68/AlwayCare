// API Configuration
const API_CONFIG = {
  development: "",
  production:
    process.env.REACT_APP_API_BASE_URL ||
    "https://your-backend-url.herokuapp.com",
};

// Get the current environment
const isDevelopment = process.env.NODE_ENV === "development";
const API_BASE_URL = isDevelopment
  ? API_CONFIG.development
  : API_CONFIG.production;

export default API_BASE_URL;
