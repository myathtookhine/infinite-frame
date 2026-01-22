import { useTheme } from '../../context/ThemeContext';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const Select = ({ 
  label, 
  value, 
  onChange, 
  options = [], 
  placeholder = 'Select...',
  disabled = false,
  required = false,
  className = ''
}) => {
  const { isDark } = useTheme();

  const inputBg = isDark ? 'bg-[#0a0a0a]' : 'bg-white';
  const borderColor = isDark ? 'border-[#262626]' : 'border-gray-300';
  const textColor = isDark ? 'text-white' : 'text-[#151416]';
  const labelColor = isDark ? 'text-gray-400' : 'text-gray-700';
  const placeholderColor = isDark ? 'text-gray-600' : 'text-gray-400';

  return (
    <div className={className}>
      {label && (
        <label className={`block mb-2 font-sans text-sm font-medium ${labelColor}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`
            w-full h-[51px] px-4 pr-10 rounded-md border-2
            ${borderColor} ${inputBg} ${textColor}
            font-sans text-sm
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${isDark ? 'focus:ring-white' : 'focus:ring-black'}
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            appearance-none cursor-pointer
            ${!value ? placeholderColor : ''}
          `}
        >
          {placeholder && (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              className={`${textColor} ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Chevron Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDownIcon className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
        </div>
      </div>
    </div>
  );
};

export default Select;
