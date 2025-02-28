// src/app/(protected)/loading.tsx
'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function ProtectedLoading() {
  const [loadingProgress, setLoadingProgress] = useState(0)
  
  // Simulate loading progress - faster for authenticated routes
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        const next = prev + Math.random() * 15
        return next >= 100 ? 100 : next
      })
    }, 150)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 relative overflow-hidden">
      {/* Background warehouse elements */}
      <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
        <div className="absolute top-5 left-5 w-40 h-40 border-8 border-dashed border-gray-300 rounded-lg"></div>
        <div className="absolute bottom-10 right-10 w-60 h-60 border-8 border-dashed border-gray-300 rounded-lg"></div>
        <div className="absolute top-1/4 right-1/4 w-20 h-20 border-4 border-dashed border-gray-300 rounded-lg"></div>
        
        {/* Shelves */}
        <div className="absolute top-20 left-1/4 w-40 h-4 bg-gray-300"></div>
        <div className="absolute top-40 left-1/4 w-40 h-4 bg-gray-300"></div>
        <div className="absolute top-60 left-1/4 w-40 h-4 bg-gray-300"></div>
        
        <div className="absolute top-20 right-1/4 w-40 h-4 bg-gray-300"></div>
        <div className="absolute top-40 right-1/4 w-40 h-4 bg-gray-300"></div>
        <div className="absolute top-60 right-1/4 w-40 h-4 bg-gray-300"></div>
        
        {/* Shelf supports */}
        <div className="absolute top-20 left-1/4 w-2 h-60 bg-gray-300"></div>
        <div className="absolute top-20 left-1/4 ml-38 w-2 h-60 bg-gray-300"></div>
        
        <div className="absolute top-20 right-1/4 w-2 h-60 bg-gray-300"></div>
        <div className="absolute top-20 right-1/4 mr-38 w-2 h-60 bg-gray-300"></div>
        
        {/* Boxes */}
        <div className="absolute top-24 left-1/4 ml-5 w-10 h-10 bg-gray-300 rounded"></div>
        <div className="absolute top-24 left-1/4 ml-20 w-12 h-12 bg-gray-300 rounded"></div>
        <div className="absolute top-44 left-1/4 ml-8 w-14 h-12 bg-gray-300 rounded"></div>
        <div className="absolute top-44 left-1/4 ml-25 w-8 h-12 bg-gray-300 rounded"></div>
        
        <div className="absolute top-24 right-1/4 mr-5 w-10 h-10 bg-gray-300 rounded"></div>
        <div className="absolute top-24 right-1/4 mr-20 w-12 h-12 bg-gray-300 rounded"></div>
        <div className="absolute top-44 right-1/4 mr-8 w-14 h-12 bg-gray-300 rounded"></div>
        <div className="absolute top-44 right-1/4 mr-25 w-8 h-12 bg-gray-300 rounded"></div>
      </div>
      
      {/* Animated forklift that moves back and forth */}
      <div className="absolute animate-forklift-move left-0 bottom-10">
        <div className="relative w-24 h-20">
          <div className="absolute bottom-0 left-0 w-20 h-8 bg-amber-500 rounded-sm"></div>
          <div className="absolute bottom-8 left-4 w-12 h-10 bg-amber-600 rounded-t-md"></div>
          <div className="absolute bottom-0 left-0 w-5 h-5 bg-gray-800 rounded-full"></div>
          <div className="absolute bottom-0 left-14 w-5 h-5 bg-gray-800 rounded-full"></div>
          <div className="absolute bottom-5 left-1 w-18 h-1 bg-gray-700"></div>
          <div className="absolute bottom-4 left-0 w-2 h-12 bg-gray-700"></div>
          <div className="absolute bottom-10 left-1 w-10 h-1 bg-gray-700"></div>
          <div className="absolute bottom-16 left-1 w-10 h-1 bg-gray-700"></div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center bg-white p-8 rounded-xl shadow-xl border border-gray-100 max-w-sm w-full">
        <div className="mb-6 relative">
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center bg-blue-50 rounded-full p-3 border-4 border-blue-100">
            <Image 
              src="/favicon.png" 
              alt="American Wholesalers Logo" 
              width={80} 
              height={80}
              className="animate-pulse"
            />
          </div>
        </div>
        
        <h1 className="text-xl font-bold text-gray-800 mb-2">Loading Data</h1>
        
        {/* Progress bar */}
        <div className="relative mb-4">
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
        </div>
        
        {/* Loading message */}
        <div className="text-sm text-gray-500">
          <LoadingMessage />
        </div>
      </div>
    </div>
  )
}

// Rotating loading messages component
function LoadingMessage() {
  const messages = [
    "Loading your data...",
    "Preparing items...",
    "Updating inventory...",
    "Almost ready...",
    "Just a moment..."
  ]
  
  const [messageIndex, setMessageIndex] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length)
    }, 1500)
    
    return () => clearInterval(interval)
  }, [])
  
  return <p>{messages[messageIndex]}</p>
}