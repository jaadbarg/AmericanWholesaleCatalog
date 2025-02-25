// src/components/ui/input.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helpText?: string;
  endAdornment?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, endAdornment, helpText, className = '', ...props }, ref) => {
    const baseInputClasses = 'block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 transition-colors';
    const validClasses = 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
    const errorClasses = 'border-red-300 focus:border-red-500 focus:ring-red-500';
    
    const inputClasses = `${baseInputClasses} ${error ? errorClasses : validClasses} ${className}`;
    
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={props.id} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              {icon}
            </span>
          )}
          
          <input
            ref={ref}
            className={`${inputClasses} ${icon ? 'pl-10' : ''} ${endAdornment ? 'pr-10' : ''}`}
            {...props}
          />
          
          {endAdornment && (
            <span className="absolute inset-y-0 right-0 flex items-center">
              {endAdornment}
            </span>
          )}
        </div>
        
        {helpText && !error && (
          <p className="text-xs text-gray-500">{helpText}</p>
        )}
        
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center text-xs text-red-500"
          >
            <AlertCircle size={12} className="mr-1" />
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

export const TextArea = React.forwardRef<
  HTMLTextAreaElement,
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
    label?: string;
    error?: string;
    helpText?: string;
    className?: string;
  }
>(({ label, error, helpText, className = '', ...props }, ref) => {
  const baseClasses = 'block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 transition-colors';
  const validClasses = 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
  const errorClasses = 'border-red-300 focus:border-red-500 focus:ring-red-500';
  
  const textareaClasses = `${baseClasses} ${error ? errorClasses : validClasses} ${className}`;
  
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <textarea
        ref={ref}
        className={textareaClasses}
        {...props}
      />
      
      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center text-xs text-red-500"
        >
          <AlertCircle size={12} className="mr-1" />
          {error}
        </motion.p>
      )}
    </div>
  );
});

export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    
    return (
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        className={`${className}`}
        {...props}
        endAdornment={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="pr-3 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
      />
    );
  }
);

Input.displayName = 'Input';
TextArea.displayName = 'TextArea';
PasswordInput.displayName = 'PasswordInput';