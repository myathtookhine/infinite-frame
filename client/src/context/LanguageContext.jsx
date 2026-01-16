import React, { createContext, useContext, useEffect, useState } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'my'; // Default to Myanmar
  });

  const [translations, setTranslations] = useState({});

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await import(`../locales/${language}.json`);
        setTranslations(response.default);
      } catch (error) {
        console.error('Error loading translations:', error);
      }
    };

    loadTranslations();
    localStorage.setItem('language', language);
    
    // Update document lang attribute
    document.documentElement.lang = language === 'my' ? 'my' : 'en';
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'my' ? 'en' : 'my'));
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key;
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
