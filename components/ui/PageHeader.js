import React from 'react';
import { Button } from '@/components/ui';

const PageHeader = ({ 
  title, 
  subtitle,
  actions,
  className = '' 
}) => {
  return (
    <div className={`text-center mb-6 ${className}`}>
      <h1 className="text-4xl font-light text-black mb-4">{title}</h1>
      {subtitle && (
        <p className="text-gray-600 mb-4">{subtitle}</p>
      )}
      <div className="w-16 h-px bg-black mx-auto mb-6"></div>
      
      {actions && (
        <div className="flex justify-center gap-4 flex-wrap">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'primary'}
              size={action.size || 'md'}
              onClick={action.onClick}
              disabled={action.disabled}
              className={action.className}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PageHeader;