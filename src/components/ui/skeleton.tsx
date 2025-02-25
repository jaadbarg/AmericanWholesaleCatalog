// src/components/ui/skeleton.tsx
import React from 'react';

interface SkeletonProps {
  className?: string;
  height?: string | number;
  width?: string | number;
  rounded?: boolean | string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  height,
  width,
  rounded = 'md',
}) => {
  const baseClasses = 'animate-pulse bg-gray-200';
  let roundedClasses = '';
  
  if (typeof rounded === 'boolean') {
    roundedClasses = rounded ? 'rounded-full' : '';
  } else {
    roundedClasses = `rounded-${rounded}`;
  }
  
  const styles: React.CSSProperties = {};
  
  if (height) styles.height = typeof height === 'number' ? `${height}px` : height;
  if (width) styles.width = typeof width === 'number' ? `${width}px` : width;
  
  return (
    <div 
      className={`${baseClasses} ${roundedClasses} ${className}`}
      style={styles}
    />
  );
};

export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton 
          key={index}
          className="h-4"
          width={index === lines - 1 && lines > 1 ? '80%' : '100%'}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{
  className?: string;
  hasImage?: boolean;
}> = ({ className = '', hasImage = false }) => {
  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      {hasImage && (
        <Skeleton className="mb-4 h-48 w-full" />
      )}
      <Skeleton className="h-6 w-3/4 mb-4" />
      <SkeletonText lines={3} />
      <div className="mt-4 flex justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
};