import axios from 'axios';

// Get API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request Interceptor
 * Automatically attach JWT token to every request
 */
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('adminToken');
    
    if (token) {
      // Attach token to Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handle token expiration and authentication errors
 */
apiClient.interceptors.response.use(
  (response) => {
    // Return successful responses as-is
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors (invalid/expired token)
    if (error.response?.status === 401) {
      // Clear local storage
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      
      // Show error message
      console.error('Session expired. Please login again.');
      
      // Redirect to login page
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Handle 403 Forbidden errors (insufficient permissions)
    if (error.response?.status === 403) {
      console.error('Access denied. Insufficient permissions.');
    }
    
    // Handle 500 Server errors
    if (error.response?.status === 500) {
      console.error('Server error. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
