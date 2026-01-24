// Centralized Configuration

// Use environment variable if available (Production), otherwise use localhost (Development)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// All API Endpoints
export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: `${API_BASE_URL}/login`,
    REGISTER: `${API_BASE_URL}/register`,
    VERIFY_OTP: `${API_BASE_URL}/verify-otp`,
    LOGOUT: `${API_BASE_URL}/logout`,
    UPDATE_PROFILE: `${API_BASE_URL}/update-profile`,
    UPDATE_GALLERY_INFO: `${API_BASE_URL}/update-gallery-info`,
    CHANGE_PASSWORD: `${API_BASE_URL}/change-password`,
    ME: `${API_BASE_URL}/me`,
  },
  // Attributes
  ATTRIBUTES: `${API_BASE_URL}/attributes`,
  ATTRIBUTE_TYPES: `${API_BASE_URL}/attributes/types`,
  // Categories
  CATEGORIES: `${API_BASE_URL}/categories`,
  // Units
  UNITS: `${API_BASE_URL}/units`,
  // Artworks
  ARTWORKS: `${API_BASE_URL}/artworks`,
  ARTWORK_UPLOAD: `${API_BASE_URL}/artworks/upload-images`,
  // Config (Master Data)
  CONFIG: (table) => `${API_BASE_URL}/config/${table}`,
  CONFIG_DELETE: (table, id) => `${API_BASE_URL}/config/${table}/${id}`,
  // Admin Management
  ADMIN_MANAGEMENT: {
    BASE: `${API_BASE_URL}/admin-management`,
    LOGS: `${API_BASE_URL}/admin-management/logs`,
    STATUS: (id) => `${API_BASE_URL}/admin-management/${id}/status`,
    DELETE: (id) => `${API_BASE_URL}/admin-management/${id}`,
    RESET_PASSWORD: (id) => `${API_BASE_URL}/admin-management/${id}/reset-password`,
  },
};
