import React, { createContext, useContext, useState, useCallback } from 'react';

const GalleryContext = createContext();

export const useGallery = () => {
  const context = useContext(GalleryContext);
  if (!context) {
    throw new Error('useGallery must be used within a GalleryProvider');
  }
  return context;
};

export const GalleryProvider = ({ children }) => {
  // Cache structure: { [slug]: { data: galleryData, scrollPosition: number, timestamp: number } }
  const [cache, setCache] = useState({});

  const cacheGallery = useCallback((slug, data) => {
    setCache(prev => ({
      ...prev,
      [slug]: {
        ...prev[slug],
        data,
        timestamp: Date.now()
      }
    }));
  }, []);

  const saveScrollPosition = useCallback((slug, position) => {
    setCache(prev => {
        // Only save if we have data for this slug (safety check)
        if (!prev[slug]) return prev;
        return {
            ...prev,
            [slug]: {
                ...prev[slug],
                scrollPosition: position
            }
        };
    });
  }, []);

  const getCachedGallery = useCallback((slug) => {
    return cache[slug] || null;
  }, [cache]);

  return (
    <GalleryContext.Provider value={{ cacheGallery, saveScrollPosition, getCachedGallery }}>
      {children}
    </GalleryContext.Provider>
  );
};
