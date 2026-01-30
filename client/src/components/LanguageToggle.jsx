import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  const options = [
    { value: 'my', label: 'MM' },
    { value: 'en', label: 'EN' },
  ];

  return (
    <div className="flex items-center p-1 rounded-full border border-theme bg-theme-inverse/5 backdrop-blur-sm">
      {options.map((option) => {
        const isActive = language === option.value;
        return (
          <button
            key={option.value}
            onClick={() => setLanguage(option.value)}
            className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all duration-200 min-w-[32px] ${isActive
              ? 'bg-theme border border-theme text-theme-inverse shadow-sm scale-110'
              : 'text-theme/50 hover:text-theme hover:bg-theme/10'
              }`}
            aria-label={`Switch to ${option.label}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageToggle;
