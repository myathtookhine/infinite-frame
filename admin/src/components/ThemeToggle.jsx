import { MoonIcon, SunIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ showLabel = false }) => {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light', icon: SunIcon, label: 'Light' },
    { value: 'dark', icon: MoonIcon, label: 'Dark' },
    { value: 'system', icon: ComputerDesktopIcon, label: 'System' },
  ];

  return (
    <div className="w-full">
      {showLabel && (
        <div className="mb-2 text-xs text-theme dark:text-theme font-sans capitalize">
          Appearance: <span className="text-theme font-light">{theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
        </div>
      )}
      <div className="flex items-center p-2 rounded-sm border border-theme backdrop-blur-sm w-full">
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.value;
          return (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`flex-1 flex justify-center items-center py-1.5 rounded-sm transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gray-900 border border-theme text-white dark:bg-white dark:text-black shadow-sm'
                  : 'text-theme dark:hover:text-theme hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
              title={option.label}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeToggle;
