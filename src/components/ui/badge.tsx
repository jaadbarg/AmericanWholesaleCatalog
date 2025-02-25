// src/components/ui/badge.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: boolean;
  className?: string;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  rounded = false,
  className = '',
  onDismiss,
  icon,
}) => {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-indigo-100 text-indigo-800',
  };
  
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };
  
  const roundedStyles = rounded ? 'rounded-full' : 'rounded-md';
  const baseStyles = 'inline-flex items-center font-medium';
  const dismissibleStyles = onDismiss ? 'pr-1' : '';
  
  const badgeStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${roundedStyles} ${dismissibleStyles} ${className}`;
  
  return (
    <motion.span
      className={badgeStyles}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`ml-1 rounded-full p-0.5 hover:bg-${variant === 'default' ? 'gray' : variant}-200 focus:outline-none`}
        >
          <X size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />
        </button>
      )}
    </motion.span>
  );
};