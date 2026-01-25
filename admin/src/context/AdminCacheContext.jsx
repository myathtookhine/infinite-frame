import React, { createContext, useContext, useState, useCallback } from 'react';

const AdminCacheContext = createContext();

export const useAdminCache = () => {
  const context = useContext(AdminCacheContext);
  if (!context) {
    throw new Error('useAdminCache must be used within a AdminCacheProvider');
  }
  return context;
};

export const AdminCacheProvider = ({ children }) => {
  // Cache structure: { [key]: { data: any, timestamp: number } }
  const [cache, setCache] = useState({});

  const setCachedData = useCallback((key, data) => {
    setCache(prev => ({
      ...prev,
      [key]: {
        data,
        timestamp: Date.now()
      }
    }));
  }, []);

  const getCachedData = useCallback((key) => {
    return cache[key] || null;
  }, [cache]);

  const invalidateCache = useCallback((keyPattern) => {
    setCache(prev => {
      const newCache = { ...prev };
      Object.keys(newCache).forEach(key => {
        if (key.includes(keyPattern)) {
          delete newCache[key];
        }
      });
      return newCache;
    });
  }, []);
  
  const clearCache = useCallback(() => {
    setCache({});
  }, []);

  return (
    <AdminCacheContext.Provider value={{ setCachedData, getCachedData, invalidateCache, clearCache }}>
      {children}
    </AdminCacheContext.Provider>
  );
};
