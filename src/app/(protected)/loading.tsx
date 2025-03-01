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
    <div className="min-h-screen flex flex-col justify-center items-center bg-blue-50 relative overflow-hidden">
      {/* Enhanced warehouse background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Warehouse floor */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-gray-200 to-gray-100"></div>
        
        {/* Floor grid lines */}
        <div className="absolute bottom-0 left-0 right-0 h-40" style={{ 
          backgroundImage: 'linear-gradient(90deg, transparent 98%, rgba(156, 163, 175, 0.3) 2%),linear-gradient(0deg, transparent 98%, rgba(156, 163, 175, 0.3) 2%)',
          backgroundSize: '40px 40px'
        }}></div>
        
        {/* Left warehouse shelves */}
        <div className="absolute left-10 top-1/2 transform -translate-y-1/2 w-20 h-80 bg-gradient-to-r from-blue-100 to-blue-50 border-r-4 border-blue-200 overflow-hidden">
          {/* Shelf levels */}
          {[...Array(5)].map((_, i) => (
            <div key={`left-shelf-${i}`} className="absolute w-full h-[15%] border-b-2 border-blue-200" style={{ top: `${i * 20}%` }}>
              {/* Random boxes on each shelf */}
              <div className="absolute right-1 top-1 w-8 h-6 bg-amber-200 border border-amber-300"></div>
              <div className="absolute right-10 top-2 w-6 h-5 bg-green-200 border border-green-300"></div>
              <div className="absolute right-5 top-1 w-4 h-7 bg-red-200 border border-red-300"></div>
            </div>
          ))}
        </div>
        
        {/* Right warehouse shelves */}
        <div className="absolute right-10 top-1/2 transform -translate-y-1/2 w-20 h-80 bg-gradient-to-l from-blue-100 to-blue-50 border-l-4 border-blue-200 overflow-hidden">
          {/* Shelf levels */}
          {[...Array(5)].map((_, i) => (
            <div key={`right-shelf-${i}`} className="absolute w-full h-[15%] border-b-2 border-blue-200" style={{ top: `${i * 20}%` }}>
              {/* Random boxes on each shelf */}
              <div className="absolute left-1 top-1 w-8 h-6 bg-purple-200 border border-purple-300"></div>
              <div className="absolute left-10 top-2 w-6 h-5 bg-yellow-200 border border-yellow-300"></div>
              <div className="absolute left-5 top-1 w-4 h-7 bg-blue-200 border border-blue-300"></div>
            </div>
          ))}
        </div>
        
        {/* Back wall with shelves */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-blue-100 to-transparent overflow-hidden">
          {/* Large warehouse shelves */}
          <div className="grid grid-cols-3 gap-2 mx-auto max-w-3xl pt-4">
            {[...Array(3)].map((_, i) => (
              <div key={`back-shelf-${i}`} className="h-24 bg-gradient-to-b from-gray-200 to-gray-100 border-2 border-gray-300 rounded-sm p-1">
                {/* Shelves with products */}
                <div className="h-1/3 border-b border-gray-300 flex items-end justify-around">
                  <div className="w-2/5 h-4/5 bg-amber-300 border border-amber-400"></div>
                  <div className="w-2/5 h-3/5 bg-sky-300 border border-sky-400"></div>
                </div>
                <div className="h-1/3 border-b border-gray-300 flex items-end justify-around">
                  <div className="w-2/5 h-3/5 bg-red-300 border border-red-400"></div>
                  <div className="w-2/5 h-4/5 bg-green-300 border border-green-400"></div>
                </div>
                <div className="h-1/3 flex items-end justify-around">
                  <div className="w-2/5 h-4/5 bg-purple-300 border border-purple-400"></div>
                  <div className="w-2/5 h-3/5 bg-orange-300 border border-orange-400"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Animated forklift that moves back and forth - moved higher up */}
      <div className="absolute animate-forklift-move left-0 bottom-1/3 z-10">
        <div className="relative w-32 h-28">
          {/* Enhanced forklift design */}
          <div className="absolute bottom-0 left-0 w-24 h-10 bg-amber-500 rounded-md"></div>
          <div className="absolute bottom-9 left-6 w-14 h-12 bg-amber-600 rounded-t-md"></div>
          {/* Driver */}
          <div className="absolute bottom-12 left-8 w-8 h-8 bg-blue-500 rounded-t-full"></div>
          <div className="absolute bottom-16 left-10 w-4 h-4 bg-amber-100 rounded-full"></div>
          {/* Wheels */}
          <div className="absolute bottom-0 left-2 w-6 h-6 bg-gray-800 rounded-full"></div>
          <div className="absolute bottom-0 left-16 w-6 h-6 bg-gray-800 rounded-full"></div>
          {/* Lift mechanism */}
          <div className="absolute bottom-3 left-0 w-2 h-16 bg-gray-700"></div>
          <div className="absolute bottom-3 left-28 w-2 h-16 bg-gray-700"></div>
          {/* Forks */}
          <div className="absolute bottom-6 left-0 w-30 h-2 bg-gray-700"></div>
          <div className="absolute bottom-12 left-0 w-30 h-2 bg-gray-700"></div>
          {/* Box being carried */}
          <div className="absolute bottom-10 left-4 w-16 h-12 bg-brown-400 border-2 border-brown-500 flex items-center justify-center">
            <div className="text-xs text-white font-bold">BOX</div>
          </div>
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