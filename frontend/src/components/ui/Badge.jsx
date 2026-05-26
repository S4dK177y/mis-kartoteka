import React from 'react';

export const Badge = ({ children, variant = 'active', className = '', ...props }) => {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
};
