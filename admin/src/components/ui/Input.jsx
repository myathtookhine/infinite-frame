import { forwardRef, useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useTheme } from "../../context/ThemeContext";

const Input = forwardRef(
  (
    {
      type = "text",
      label,
      error,
      className = "",
      containerClassName = "",
      icon: Icon,
      showPasswordToggle,
      ...props
    },
    ref
  ) => {
    const { isDark } = useTheme();
    const [visible, setVisible] = useState(false);
    const isPassword = type === "password";
    const enableToggle =
      typeof showPasswordToggle === "boolean" ? showPasswordToggle : isPassword;

    const paddingLeft = Icon ? "pl-10" : "pl-4";
    const paddingRight = enableToggle ? "pr-10" : "pr-4";

    const inputType =
      isPassword && enableToggle ? (visible ? "text" : "password") : type;

    const labelClass = isDark ? "text-gray-300" : "text-gray-700";
    const iconClass = isDark ? "text-gray-500" : "text-gray-400";
    const inputClass = isDark
      ? "border-[#262626] bg-[#0a0a0a] text-white placeholder:text-gray-600 focus:ring-white focus:border-white"
      : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-gray-900 focus:border-gray-900";
    const toggleClass = isDark
      ? "text-gray-400 hover:text-gray-200"
      : "text-gray-500 hover:text-gray-700";

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
          {Icon && (
            <Icon
              className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${iconClass} pointer-events-none`}
              aria-hidden="true"
            />
          )}

          <input
            ref={ref}
            type={inputType}
            className={`w-full ${paddingLeft} ${paddingRight} py-3 border-2 rounded-md font-sans focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${inputClass} ${className}`}
            {...props}
          />

          {enableToggle && isPassword && (
            <button
              type="button"
              aria-label={visible ? "Hide password" : "Show password"}
              onClick={() => setVisible((v) => !v)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-6 w-6 ${toggleClass}`}
            >
              {visible ? (
                <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <EyeIcon className="h-5 w-5" aria-hidden="true" />
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

Input.displayName = 'Input';

export default Input;
