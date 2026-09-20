import React, { forwardRef, useId } from 'react';

const Input = forwardRef(({ 
  label, 
  error, 
  hint,
  className = '', 
  id,
  leftIcon,
  rightIcon,
  ...props 
}, ref) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-base-content mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`block w-full rounded-md border-base-300 bg-base-200 text-base-content focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm border transition-colors ${
            leftIcon ? 'pl-10' : 'pl-4'
          } ${
            rightIcon ? 'pr-10' : 'pr-4'
          } ${
            error ? 'border-error focus:border-error focus:ring-error' : ''
          } py-3 ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/50">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
      {hint && !error && <p className="mt-1 text-sm text-base-content/70">{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
