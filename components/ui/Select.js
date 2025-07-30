import React, { forwardRef } from 'react';

const Select = forwardRef(({ 
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
  options = [],
  children,
  ...props 
}, ref) => {
  const baseClasses = 'transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    underline: 'w-full bg-transparent border-0 border-b-2 border-gray-300 focus:border-black text-black',
    outline: 'w-full bg-white border border-gray-300 rounded-md focus:border-black focus:ring-1 focus:ring-black text-black',
    filled: 'w-full bg-gray-50 border border-transparent rounded-md focus:bg-white focus:border-black focus:ring-1 focus:ring-black text-black'
  };
  
  const sizes = {
    sm: 'py-2 text-sm',
    md: 'py-3',
    lg: 'py-4 text-lg'
  };
  
  const selectClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`;
  
  return (
    <div className={`${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        ref={ref}
        className={selectClasses}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        
        {options.length > 0 ? (
          options.map((option) => (
            <option 
              key={option.value || option} 
              value={option.value || option}
            >
              {option.label || option}
            </option>
          ))
        ) : children}
      </select>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;