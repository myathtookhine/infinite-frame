// Centralized Configuration

// Check if Vite environment variable exists, otherwise default to localhost
// Use environment variable if available (Production), otherwise use localhost (Development)
// config.js
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get specific endpoints if needed
export const ENDPOINTS = {
  AUTH: `${API_BASE_URL}/auth`,
  ATTRIBUTES: `${API_BASE_URL}/attributes`,
  // Add more as needed
};
