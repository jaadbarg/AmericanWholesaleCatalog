// src/components/ui/button.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon,
    fullWidth = false,
    className = '',
    disabled,
    ...props
  }, ref) => {
    // Base styles that apply to all buttons
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    // Variant-specific styles
    const variantStyles = {
      primary: 'bg-blue-900 hover:bg-blue-800 text-white focus:ring-blue-500',
      secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 focus:ring-gray-400',
      outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-blue-500',
      ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-gray-400',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    };
    
    // Size-specific styles
    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5',
      md: 'text-sm px-4 py-2',
      lg: 'text-base px-6 py-3',
    };
    
    // Disabled and loading styles
    const disabledStyles = (disabled || isLoading) ? 'opacity-50 cursor-not-allowed' : '';
    const widthStyles = fullWidth ? 'w-full' : '';
    
    // Combine all styles
    const buttonStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${widthStyles} ${className}`;
    
    // Use a regular button inside a motion div to avoid type conflicts
    return (
      <motion.div
        whileHover={(!disabled && !isLoading) ? { scale: 1.02 } : {}}
        whileTap={(!disabled && !isLoading) ? { scale: 0.98 } : {}}
        className="inline-block"
        style={fullWidth ? { width: '100%' } : {}}
      >
        <button
          ref={ref}
          className={buttonStyles}
          disabled={disabled || isLoading}
          {...props}
        >
          {isLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {!isLoading && icon && (
            <span className="mr-2">{icon}</span>
          )}
          {children}
        </button>
      </motion.div>
    );
  }
);

Button.displayName = 'Button';