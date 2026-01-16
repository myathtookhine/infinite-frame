import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '../config';

const AuthContext = createContext(null);

// Base URL for API
// Imported from config

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('adminToken');
    const storedUser = localStorage.getItem('adminUser');
    if (token && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      // Make API call to the backend login endpoint using axios
      const response = await axios.post(ENDPOINTS.AUTH.LOGIN, {
        username,
        password,
      });

      const userData = response.data.user;
      const token = response.data.token; // ← Get REAL JWT token from backend

      // Store JWT token and user data
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(userData));

      setIsAuthenticated(true);
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        return { success: false, error: error.response.data.message || 'Invalid credentials' };
      }
      return { success: false, error: 'Unable to connect to server.' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(ENDPOINTS.AUTH.REGISTER, userData);
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed.'
      };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const response = await axios.post(ENDPOINTS.AUTH.VERIFY_OTP, { email, otp });
      return { success: true, user: response.data.user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Verification failed.'
      };
    }
  };

  const logout = async () => {
    try {
      if (user?.id) {
        await axios.post(ENDPOINTS.AUTH.LOGOUT, { userId: user.id });
      }
    } catch (err) {
      console.error("Logout log failed:", err);
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const updateProfile = async (newUsername) => {
    try {
      const response = await axios.post(ENDPOINTS.AUTH.UPDATE_PROFILE, {
        userId: user.id,
        newUsername
      });

      const updatedUserData = response.data.user;
      localStorage.setItem('adminUser', JSON.stringify(updatedUserData));
      setUser(updatedUserData);

      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Update failed.'
      };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await axios.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        userId: user.id,
        currentPassword,
        newPassword
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Password change failed.'
      };
    }
  };

  const updateGalleryInfo = async (galleryData) => {
    try {
      const response = await axios.post(ENDPOINTS.AUTH.UPDATE_GALLERY_INFO, {
        userId: user.id,
        ...galleryData
      });

      const updatedUserData = response.data.user;
      localStorage.setItem('adminUser', JSON.stringify(updatedUserData));
      setUser(updatedUserData);

      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Update failed.'
      };
    }
  };

  const value = {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
    register,
    verifyOtp,
    changePassword,
    updateProfile,
    updateGalleryInfo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
