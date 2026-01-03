import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Base URL for API
const API_BASE_URL = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      // Make API call to the backend login endpoint using axios
      const response = await axios.post(`${API_BASE_URL}/login`, {
        username,
        password,
      });

      // axios automatically parses JSON response
      const { user } = response.data;

      // Login successful
      const token = 'admin-token-' + Date.now();
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(user));
      setIsAuthenticated(true);

      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        return { success: false, error: error.response.data.message || 'Invalid credentials' };
      }
      return { success: false, error: 'Unable to connect to server.' };
    }
  };

  const sendOtp = async (email) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/send-otp`, { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send OTP. Please try again.'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, userData);
      return { success: true, user: response.data.user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed.'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setIsAuthenticated(false);
  };

  const changePassword = (currentPassword, newPassword) => {
    // For demo purposes, accept if current password is 123123
    if (currentPassword === '123123') {
      // In a real app, you'd update the password on the server
      return { success: true, message: 'Password changed successfully' };
    }
    return { success: false, error: 'Current password is incorrect' };
  };

  const updateUsername = (newUsername) => {
    // For demo purposes, accept any non-empty username
    if (newUsername && newUsername.trim() !== '') {
      // In a real app, you'd update the username on the server
      localStorage.setItem('adminUsername', newUsername);
      return { success: true, message: 'Username updated successfully' };
    }
    return { success: false, error: 'Invalid username' };
  };

  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout,
    sendOtp,
    register,
    changePassword: () => { }, // Placeholders
    updateUsername: () => { },
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
