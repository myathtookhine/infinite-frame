import { forwardRef, useState } from 'react';
import { useTheme } from "../../context/ThemeContext";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

const InputTextarea = forwardRef(
  (
    {
      label,
      error,
      className = "",
      containerClassName = "",
      rows = 4,
      minHeight = "120px",
      height,
      ...props
    },
    ref
  ) => {
    const { isDark } = useTheme();
    const [isExpanded, setIsExpanded] = useState(false);

    const labelClass = isDark ? "text-gray-300" : "text-gray-700";
    const inputClass = isDark
      ? "border-[#262626] bg-[#0a0a0a] text-white placeholder:text-gray-600 focus:ring-white focus:border-white"
      : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-gray-900 focus:border-gray-900";

    // Parse height values to compare
    const parseHeight = (heightValue) => {
      if (!heightValue) return 0;
      return parseInt(heightValue.replace('px', ''));
    };

    const minHeightValue = parseHeight(minHeight);
    const heightValue = parseHeight(height);
    const showToggle = height && heightValue > minHeightValue;

    const customStyles = {
      minHeight: minHeight,
      height: isExpanded ? height : (showToggle ? minHeight : height),
      transition: 'height 0.3s ease-in-out',
    };

    return (
      <div className={containerClassName}>
        {label && (
          <label
            htmlFor={props.id}
            className={`block font-sans text-sm font-medium mb-2 ${labelClass}`}
          >
            {label}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            rows={rows}
            style={customStyles}
            className={`w-full px-4 py-3 border-2 rounded-md font-sans focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed resize-y ${inputClass} ${className}`}
            {...props}
          />

          {/* See More/Less Toggle */}
          {showToggle && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`absolute bottom-6 right-6 flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-sans font-semibold transition-colors ${isDark
                ? 'bg-gray-800 text-blue-300 hover:bg-gray-700 border border-gray-700'
                : 'bg-gray-100 text-blue-700 hover:bg-gray-200 border border-gray-300'
                }`}
            >
              {isExpanded ? (
                <>
                  <ChevronUpIcon className="h-3.5 w-3.5" />
                  See Less
                </>
              ) : (
                <>
                  <ChevronDownIcon className="h-3.5 w-3.5" />
                  See More
                </>
              )}
            </button>
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm font-sans text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

InputTextarea.displayName = 'InputTextarea';

export default InputTextarea;
