// src/components/ui/LoadingSpinner.tsx
import Image from 'next/image'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  message?: string
  showLogo?: boolean
  className?: string
}

export function LoadingSpinner({ 
  size = 'medium', 
  message = 'Loading...', 
  showLogo = true,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: {
      container: 'p-2',
      logo: { width: 24, height: 24 },
      spinner: 'h-3 w-3',
      text: 'text-xs'
    },
    medium: {
      container: 'p-4',
      logo: { width: 40, height: 40 },
      spinner: 'h-5 w-5',
      text: 'text-sm'
    },
    large: {
      container: 'p-6',
      logo: { width: 60, height: 60 },
      spinner: 'h-8 w-8',
      text: 'text-base'
    }
  }

  const sizeClass = sizeClasses[size]

  return (
    <div className={`flex flex-col items-center justify-center ${sizeClass.container} ${className}`}>
      {showLogo && (
        <div className="mb-4">
          <Image
            src="/favicon.png"
            alt="American Wholesalers Logo"
            width={sizeClass.logo.width}
            height={sizeClass.logo.height}
            className="animate-pulse"
          />
        </div>
      )}
      
      <div className="flex items-center justify-center">
        <div className={`animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 ${sizeClass.spinner} mr-2`}></div>
        {message && <span className={`text-gray-600 ${sizeClass.text}`}>{message}</span>}
      </div>
    </div>
  )
}

// Loading overlay that covers the entire parent element
export function LoadingOverlay({ 
  message = 'Loading...',
  transparent = false
}: { 
  message?: string,
  transparent?: boolean
}) {
  return (
    <div className={`absolute inset-0 flex items-center justify-center z-50 ${transparent ? 'bg-white/70' : 'bg-white'}`}>
      <LoadingSpinner size="large" message={message} showLogo={true} />
    </div>
  )
}

export default LoadingSpinner