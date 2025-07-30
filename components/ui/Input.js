import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
  type = 'text',
  as = 'input',
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
  rows,
  ...props 
}, ref) => {
  const baseClasses = 'transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    underline: as === 'textarea' 
      ? 'w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:border-black focus:ring-1 focus:ring-black text-black placeholder-gray-400 resize-vertical'
      : 'w-full px-0 bg-transparent border-0 border-b-2 border-gray-300 focus:border-black text-black placeholder-gray-400',
    outline: 'w-full px-3 bg-white border border-gray-300 rounded-md focus:border-black focus:ring-1 focus:ring-black text-black placeholder-gray-400' + (as === 'textarea' ? ' resize-vertical' : ''),
    filled: 'w-full px-3 bg-gray-50 border border-transparent rounded-md focus:bg-white focus:border-black focus:ring-1 focus:ring-black text-black placeholder-gray-400' + (as === 'textarea' ? ' resize-vertical' : '')
  };
  
  const sizes = {
    sm: as === 'textarea' ? 'py-2 text-sm' : 'py-2 text-sm',
    md: as === 'textarea' ? 'py-2' : 'py-3',
    lg: as === 'textarea' ? 'py-3 text-lg' : 'py-4 text-lg'
  };
  
  const inputClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`;
  
  const Component = as === 'textarea' ? 'textarea' : 'input';
  
  return (
    <div className={`${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <Component
        ref={ref}
        type={as === 'textarea' ? undefined : type}
        rows={as === 'textarea' ? rows : undefined}
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