// src/components/ui/card.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  animated?: boolean;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  animated = false,
  hoverable = false,
}) => {
  const baseClasses = 'bg-white rounded-lg shadow overflow-hidden';
  const hoverableClasses = hoverable ? 'transition-shadow hover:shadow-lg' : '';
  const combinedClasses = `${baseClasses} ${hoverableClasses} ${className}`;
  
  if (animated) {
    return (
      <motion.div 
        className={combinedClasses}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={hoverable ? { y: -4 } : undefined}
      >
        {children}
      </motion.div>
    );
  }
  
  return <div className={combinedClasses}>{children}</div>;
};

export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`p-4 border-b ${className}`}>
      {children}
    </div>
  );
};

export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`p-4 border-t bg-gray-50 ${className}`}>
      {children}
    </div>
  );
};