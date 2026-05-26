import React from 'react';

export const Button = ({ children, variant = 'primary', icon, className = '', type = 'button', ...props }) => {
  const baseClass = 'btn';
  const variantClass = variant ? `btn-${variant}` : '';
  const iconClass = icon && !children ? 'btn-icon' : '';
  
  return (
    <button 
      type={type}
      className={`${baseClass} ${variantClass} ${iconClass} ${className}`.trim()} 
      {...props}
    >
      {children}
    </button>
  );
};
