import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center border-2 border-theme">
      <button
        onClick={() => setLanguage('my')}
        className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
          language === 'my' 
            ? 'bg-theme-inverse' 
            : 'bg-transparent hover:opacity-70'
        }`}
        aria-label="Switch to Myanmar"
      >
        မြန်မာ
      </button>
      <div className="w-px h-6 bg-theme"></div>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
          language === 'en' 
            ? 'bg-theme-inverse' 
            : 'bg-transparent hover:opacity-70'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
    </div>
  );
};

export default LanguageToggle;
