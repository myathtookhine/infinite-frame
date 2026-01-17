import { forwardRef } from 'react';
import { useTheme } from "../../context/ThemeContext";

const Button = forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "md",
      type = "button",
      block = false,
      disabled = false,
      onClick,
      className = "",
      ...props
    },
    ref
  ) => {
    const { isDark } = useTheme();

    // Base styles
    const baseStyles =
      "font-sans font-medium transition-all duration-200 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    // Variant styles for light and dark themes
    const variantStyles = {
      primary: isDark
        ? "bg-white text-black border-white hover:bg-gray-200 hover:border-gray-200 focus:ring-white cursor-pointer"
        : "bg-gray-900 text-white border-gray-900 hover:bg-gray-800 hover:border-gray-800 focus:ring-gray-900 cursor-pointer",
      secondary: isDark
        ? "bg-transparent text-white border-white hover:bg-white/10 focus:ring-white cursor-pointer"
        : "bg-transparent text-gray-900 border-gray-900 hover:bg-gray-900/5 focus:ring-gray-900 cursor-pointer",
    };

    // Size styles
    const sizeStyles = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-5 py-2.5 text-base",
      lg: "px-7 py-3.5 text-lg",
    };

    // Block style
    const blockStyle = block ? "w-full" : "";

    const combinedClassName =
      `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${blockStyle} ${className}`.trim();

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={combinedClassName}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
