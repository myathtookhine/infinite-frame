import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { MoonIcon, SunIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light', icon: SunIcon, label: 'Light' },
    { value: 'dark', icon: MoonIcon, label: 'Dark' },
    { value: 'system', icon: ComputerDesktopIcon, label: 'System' },
  ];

  return (
    <div className="flex items-center p-1 rounded-full border border-theme bg-theme-inverse/5 backdrop-blur-sm">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;
        return (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={`p-1.5 rounded-full transition-all duration-200 ${isActive
              ? 'bg-theme border border-theme text-theme-inverse shadow-sm scale-110'
              : 'text-theme/50 hover:text-theme hover:bg-theme/10'
              }`}
            title={option.label}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
