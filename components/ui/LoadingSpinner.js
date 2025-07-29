import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const LoadingSpinner = ({ 
  size = 'md', 
  text, 
  className = '', 
  centered = false,
  fullScreen = false 
}) => {
  const sizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  const spinnerComponent = (
    <div className={`flex flex-col items-center text-black ${className}`}>
      <FontAwesomeIcon 
        icon={faSpinner} 
        spin 
        className={`${sizes[size]} ${text ? 'mb-2' : ''}`} 
      />
      {text && (
        <span className={`${size === 'xs' || size === 'sm' ? 'text-xs' : 'text-sm'} font-light`}>
          {text}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        {spinnerComponent}
      </div>
    );
  }

  if (centered) {
    return (
      <div className="flex justify-center items-center py-12">
        {spinnerComponent}
      </div>
    );
  }

  return spinnerComponent;
};

export default LoadingSpinner;