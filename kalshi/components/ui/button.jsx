import React from 'react';

export function Button({ className = '', variant = 'default', children, ...props }) {
  const base = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    default: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-emerald-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-500',
    outline: 'border border-gray-700 text-gray-200 hover:bg-gray-800 focus-visible:outline-emerald-500',
    ghost: 'text-gray-300 hover:bg-gray-800',
  };
  const classes = `${base} ${variants[variant] || variants.default} ${className}`;

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
