import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
  type = 'text',
  variant = 'underline',
  size = 'md',
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  required = false,
  disabled = false,
  placeholder,
  value,
  onChange,
  ...props 
}, ref) => {
  const baseClasses = 'transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    underline: 'w-full px-0 bg-transparent border-0 border-b border-gray-300 focus:border-black text-black placeholder-gray-400',
    outline: 'w-full px-3 bg-white border border-gray-300 rounded-md focus:border-black focus:ring-1 focus:ring-black text-black placeholder-gray-400',
    filled: 'w-full px-3 bg-gray-50 border border-transparent rounded-md focus:bg-white focus:border-black focus:ring-1 focus:ring-black text-black placeholder-gray-400'
  };
  
  const sizes = {
    sm: 'py-2 text-sm',
    md: 'py-3',
    lg: 'py-4 text-lg'
  };
  
  const inputClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`;
  
  return (
    <div className={`${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        ref={ref}
        type={type}
        className={inputClasses}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        {...props}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;