import { forwardRef } from 'react';

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      type = 'button',
      block = false,
      disabled = false,
      onClick,
      className = '',
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles =
      'font-sans font-medium transition-all duration-200 border-2 rounded-md shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed';

    // Variant styles
    const variantStyles = {
      primary:
        'bg-black text-white border-black hover:bg-gray-800 cursor-pointer hover:border-gray-800',
      secondary:
        'bg-white text-black border-black hover:bg-gray-100 cursor-pointer',
    };

    // Size styles
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-base',
      lg: 'px-7 py-3.5 text-lg',
    };

    // Block style
    const blockStyle = block ? 'w-full' : '';

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${blockStyle} ${className}`.trim();

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
