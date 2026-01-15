import { forwardRef } from 'react';
import { useTheme } from "../../context/ThemeContext";

const InputTextarea = forwardRef(
  (
    {
      label,
      error,
      className = "",
      containerClassName = "",
      rows = 4,
      minHeight = "100px",
      height,
      ...props
    },
    ref
  ) => {
    const { isDark } = useTheme();

    const labelClass = isDark ? "text-gray-300" : "text-gray-700";
    const inputClass = isDark
      ? "border-[#262626] bg-[#0a0a0a] text-white placeholder:text-gray-600 focus:ring-white focus:border-white"
      : "border-gray-300 bg-white text-black placeholder:text-gray-400 focus:ring-black focus:border-black";

    const customStyles = {
      minHeight: minHeight,
      height: height,
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
            className={`w-full px-4 py-3 border-2 rounded-md font-sans focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all resize-y ${inputClass} ${className}`}
            {...props}
          />
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
