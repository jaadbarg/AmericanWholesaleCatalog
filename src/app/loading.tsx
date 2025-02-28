// src/app/loading.tsx
'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function Loading() {
  const [loadingProgress, setLoadingProgress] = useState(0)
  
  // Simulate loading progress
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        const next = prev + Math.random() * 10
        return next >= 100 ? 100 : next
      })
    }, 200)
    
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
      <div className="relative z-10 text-center bg-white p-10 rounded-xl shadow-xl border border-gray-100 max-w-md w-full">
        <div className="mb-8 relative">
          <div className="relative mx-auto w-32 h-32 flex items-center justify-center bg-blue-50 rounded-full p-4 border-4 border-blue-100">
            <Image 
              src="/favicon.png" 
              alt="American Wholesalers Logo" 
              width={100} 
              height={100}
              className="animate-pulse"
            />
          </div>
          
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
            WHOLESALE CATALOG
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">American Wholesalers</h1>
        <p className="text-gray-600 mb-6">Loading your inventory management system...</p>
        
        {/* Progress bar */}
        <div className="relative mb-4">
          <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <div className="mt-2 text-sm text-gray-500 text-right">{Math.round(loadingProgress)}%</div>
        </div>
        
        {/* Loading message */}
        <div className="text-sm text-gray-500 mt-6">
          <LoadingMessage />
        </div>
      </div>
    </div>
  )
}

// Rotating loading messages component
function LoadingMessage() {
  const messages = [
    "Stocking the shelves...",
    "Organizing inventory...",
    "Preparing your catalog...",
    "Counting products...",
    "Loading customer data...",
    "Checking warehouse status...",
    "Updating product information..."
  ]
  
  const [messageIndex, setMessageIndex] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length)
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])
  
  return <p>{messages[messageIndex]}</p>
}