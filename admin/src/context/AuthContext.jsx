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

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    localStorage.setItem('adminUser', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const refreshUser = async (userId) => {
    const id = userId || user?.id;
    if (!id) return null;

    try {
      const response = await axios.get(ENDPOINTS.AUTH.ME, {
        headers: { 'x-admin-id': id }
      });

      if (response.data.user) {
        const storedUser = localStorage.getItem('adminUser');
        const parsedUser = storedUser ? JSON.parse(storedUser) : {};
        const { page_views, artwork_count, ...profileFields } = response.data.user;
        const updatedUser = { ...parsedUser, ...profileFields };
        localStorage.setItem('adminUser', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return response.data.user;
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }

    return null;
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('adminToken');
      const storedUser = localStorage.getItem('adminUser');

      if (token && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setIsAuthenticated(true);
        setUser(parsedUser);
        await refreshUser(parsedUser.id);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

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
    updateUser,
    refreshUser,
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
