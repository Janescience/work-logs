import React from 'react';

const PageHeader = ({ 
  title, 
  subtitle,
  className = '' 
}) => {
  return (
    <div className={`text-center ${className}`}>
      <h1 className="text-3xl font-light text-black mb-4">{title}</h1>
      {subtitle && (
        <p className="text-gray-600 mb-4">{subtitle}</p>
      )}
      <div className="w-16 h-px bg-black mx-auto"></div>
    </div>
  );
};

export default PageHeader;