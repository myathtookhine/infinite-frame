import { forwardRef, useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Input = forwardRef(
  (
    {
      type = 'text',
      label,
      error,
      className = '',
      containerClassName = '',
      icon: Icon,
      showPasswordToggle,
      ...props
    },
    ref
  ) => {
    const [visible, setVisible] = useState(false);
    const isPassword = type === 'password';
    const enableToggle = typeof showPasswordToggle === 'boolean' ? showPasswordToggle : isPassword;

    const paddingLeft = Icon ? 'pl-10' : 'pl-4';
    const paddingRight = enableToggle ? 'pr-10' : 'pr-4';

    const inputType = isPassword && enableToggle ? (visible ? 'text' : 'password') : type;

    return (
      <div className={containerClassName}>
        {label && (
          <label
            htmlFor={props.id}
            className="block font-sans text-sm font-medium mb-2"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {Icon && (
            <Icon
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none"
              aria-hidden="true"
            />
          )}

          <input
            ref={ref}
            type={inputType}
            className={`w-full ${paddingLeft} ${paddingRight} py-3 border-2 border-black rounded-md font-sans focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-shadow hover:shadow-sm focus:shadow-md ${className}`}
            {...props}
          />

          {enableToggle && isPassword && (
            <button
              type="button"
              aria-label={visible ? 'Hide password' : 'Show password'}
              onClick={() => setVisible((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-6 w-6 text-gray-500"
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
          <p className="mt-1 text-sm font-sans text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
