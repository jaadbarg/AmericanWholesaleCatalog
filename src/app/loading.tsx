// src/app/loading.tsx
import Image from 'next/image'

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <div className="text-center">
        <Image 
          src="/favicon.png" 
          alt="American Wholesalers Logo" 
          width={80} 
          height={80} 
          className="mx-auto mb-8 animate-pulse"
        />
        
        <div className="relative">
          <div className="h-2.5 w-40 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-900 rounded-full animate-loading-bar"></div>
          </div>
        </div>
        
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}