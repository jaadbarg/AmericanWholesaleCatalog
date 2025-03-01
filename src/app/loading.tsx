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
    <div className="min-h-screen flex flex-col justify-center items-center bg-american-navy-50 relative overflow-hidden">
      {/* Enhanced warehouse background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Warehouse floor */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-gray-200 to-gray-100"></div>
        
        {/* Floor grid lines */}
        <div className="absolute bottom-0 left-0 right-0 h-40" style={{ 
          backgroundImage: 'linear-gradient(90deg, transparent 98%, rgba(51, 78, 104, 0.3) 2%),linear-gradient(0deg, transparent 98%, rgba(51, 78, 104, 0.3) 2%)',
          backgroundSize: '40px 40px'
        }}></div>
        
        {/* Left warehouse shelves */}
        <div className="absolute left-10 top-1/2 transform -translate-y-1/2 w-20 h-80 bg-gradient-to-r from-american-navy-100 to-american-navy-50 border-r-4 border-american-navy-200 overflow-hidden">
          {/* Shelf levels */}
          {[...Array(5)].map((_, i) => (
            <div key={`left-shelf-${i}`} className="absolute w-full h-[15%] border-b-2 border-american-navy-200" style={{ top: `${i * 20}%` }}>
              {/* Random boxes on each shelf */}
              <div className="absolute right-1 top-1 w-8 h-6 bg-american-red-100 border border-american-red-200"></div>
              <div className="absolute right-10 top-2 w-6 h-5 bg-american-navy-200 border border-american-navy-300"></div>
              <div className="absolute right-5 top-1 w-4 h-7 bg-american-red-200 border border-american-red-300"></div>
            </div>
          ))}
        </div>
        
        {/* Right warehouse shelves */}
        <div className="absolute right-10 top-1/2 transform -translate-y-1/2 w-20 h-80 bg-gradient-to-l from-american-navy-100 to-american-navy-50 border-l-4 border-american-navy-200 overflow-hidden">
          {/* Shelf levels */}
          {[...Array(5)].map((_, i) => (
            <div key={`right-shelf-${i}`} className="absolute w-full h-[15%] border-b-2 border-american-navy-200" style={{ top: `${i * 20}%` }}>
              {/* Random boxes on each shelf */}
              <div className="absolute left-1 top-1 w-8 h-6 bg-american-navy-300 border border-american-navy-400"></div>
              <div className="absolute left-10 top-2 w-6 h-5 bg-american-red-100 border border-american-red-200"></div>
              <div className="absolute left-5 top-1 w-4 h-7 bg-american-navy-200 border border-american-navy-300"></div>
            </div>
          ))}
        </div>
        
        {/* Back wall with shelves */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-american-navy-100 to-transparent overflow-hidden">
          {/* Large warehouse shelves */}
          <div className="grid grid-cols-5 gap-3 mx-auto max-w-4xl pt-8">
            {[...Array(5)].map((_, i) => (
              <div key={`back-shelf-${i}`} className="h-32 bg-gradient-to-b from-american-navy-200 to-american-navy-100 border-2 border-american-navy-300 rounded-sm p-1">
                {/* Shelves with products - American Wholesale colors themed */}
                <div className="h-1/3 border-b border-american-navy-300 flex items-end justify-around">
                  <div className="w-2/5 h-4/5 bg-american-red-300 border border-american-red-400"></div>
                  <div className="w-2/5 h-3/5 bg-american-navy-300 border border-american-navy-400"></div>
                </div>
                <div className="h-1/3 border-b border-american-navy-300 flex items-end justify-around">
                  <div className="w-2/5 h-3/5 bg-american-navy-400 border border-american-navy-500"></div>
                  <div className="w-2/5 h-4/5 bg-american-red-400 border border-american-red-500"></div>
                </div>
                <div className="h-1/3 flex items-end justify-around">
                  <div className="w-2/5 h-4/5 bg-american-navy-500 border border-american-navy-600"></div>
                  <div className="w-2/5 h-3/5 bg-american-red-500 border border-american-red-600"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Animated forklift that moves back and forth - moved higher up */}
      <div className="absolute animate-forklift-move left-0 bottom-1/3 z-10">
        <div className="relative w-32 h-28">
          {/* Enhanced forklift design - American Wholesale themed */}
          <div className="absolute bottom-0 left-0 w-24 h-10 bg-american-navy-600 rounded-md"></div>
          <div className="absolute bottom-9 left-6 w-14 h-12 bg-american-navy-700 rounded-t-md"></div>
          {/* Driver */}
          <div className="absolute bottom-12 left-8 w-8 h-8 bg-american-red-600 rounded-t-full"></div>
          <div className="absolute bottom-16 left-10 w-4 h-4 bg-white rounded-full"></div>
          {/* Wheels */}
          <div className="absolute bottom-0 left-2 w-6 h-6 bg-gray-800 rounded-full"></div>
          <div className="absolute bottom-0 left-16 w-6 h-6 bg-gray-800 rounded-full"></div>
          {/* Lift mechanism */}
          <div className="absolute bottom-3 left-0 w-2 h-16 bg-american-navy-800"></div>
          <div className="absolute bottom-3 left-28 w-2 h-16 bg-american-navy-800"></div>
          {/* Forks */}
          <div className="absolute bottom-6 left-0 w-30 h-2 bg-american-navy-800"></div>
          <div className="absolute bottom-12 left-0 w-30 h-2 bg-american-navy-800"></div>
          {/* Box being carried - branded box */}
          <div className="absolute bottom-10 left-4 w-16 h-12 bg-american-red-600 border-2 border-american-red-700 flex items-center justify-center">
            <div className="text-xs text-white font-bold">AMERICAN</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center bg-white p-10 rounded-xl shadow-xl border border-gray-100 max-w-md w-full">
        <div className="mb-8 relative">
          <div className="relative mx-auto w-32 h-32 flex items-center justify-center bg-american-navy-50 rounded-full p-4 border-4 border-american-navy-100">
            <Image 
              src="/favicon.png" 
              alt="American Wholesalers Logo" 
              width={100} 
              height={100}
              className="animate-pulse"
            />
          </div>
          
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-american-navy-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
            WHOLESALE CATALOG
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-american-navy-800 mb-4">American Wholesalers</h1>
        <p className="text-gray-600 mb-6">Loading your inventory management system...</p>
        
        {/* Progress bar */}
        <div className="relative mb-4">
          <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-american-navy-600 rounded-full transition-all duration-300 ease-out"
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