import React from 'react';

export function Badge({ className = '', variant = 'default', children, ...props }) {
  const variants = {
    default: 'bg-gray-800 text-gray-200 border border-gray-700',
    outline: 'border border-gray-700 text-gray-300',
    secondary: 'bg-blue-900/30 text-blue-300 border border-blue-800',
  };
  const classes = `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${variants[variant] || variants.default} ${className}`;
  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
