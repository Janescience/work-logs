import React from 'react';
import {
  FontAwesomeIcon
} from '@fortawesome/react-fontawesome';

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  iconColor = 'text-gray-600',
  className = '',
  valueClassName = '',
  onClick
}) => {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={`border-gray-200 p-6 transition-shadow hover:shadow-md ${
        onClick ? 'cursor-pointer hover:bg-gray-50' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
            {title}
          </h3>
          <p className={`mt-2 text-3xl font-light text-black ${valueClassName}`}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={`ml-4 ${iconColor}`}>
            <FontAwesomeIcon icon={icon} className="text-2xl" />
          </div>
        )}
      </div>
    </Component>
  );
};

export default StatCard;