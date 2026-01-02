import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

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

  const login = (username, password) => {
    // Simple validation - default credentials: admin / 123123
    if (username === 'admin' && password === '123123') {
      const token = 'dummy-token-' + Date.now();
      localStorage.setItem('adminToken', token);
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
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
    changePassword,
    updateUsername,
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
