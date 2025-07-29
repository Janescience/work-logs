import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faExclamationCircle, faInfoCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const ErrorMessage = ({ 
  type = 'error', 
  message, 
  className = '',
  showIcon = true,
  onClose 
}) => {
  if (!message) return null;

  const types = {
    error: {
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
      icon: faExclamationCircle
    },
    warning: {
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200',
      icon: faExclamationTriangle
    },
    info: {
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200',
      icon: faInfoCircle
    },
    success: {
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
      icon: faCheckCircle
    }
  };

  const config = types[type];

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-md p-4 mb-4 ${className}`}>
      <div className="flex items-center">
        {showIcon && (
          <FontAwesomeIcon 
            icon={config.icon} 
            className={`${config.textColor} mr-3 text-sm`} 
          />
        )}
        <span className={`${config.textColor} text-sm flex-1`}>
          {message}
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className={`${config.textColor} hover:opacity-70 ml-3`}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;