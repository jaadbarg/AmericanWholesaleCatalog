// src/app/auth/loading.tsx
'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function AuthLoading() {
  const [loadingProgress, setLoadingProgress] = useState(0)
  
  // Simulate loading progress
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        const next = prev + Math.random() * 12
        return next >= 100 ? 100 : next
      })
    }, 200)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Brand with warehouse theme background */}
      <div className="hidden md:flex md:w-1/2 bg-blue-900 text-white flex-col justify-center items-center p-8 relative overflow-hidden">
        {/* Warehouse elements in the background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          {/* Warehouse shelves */}
          <div className="absolute top-20 left-10 w-60 h-4 bg-white"></div>
          <div className="absolute top-40 left-10 w-60 h-4 bg-white"></div>
          <div className="absolute top-60 left-10 w-60 h-4 bg-white"></div>
          
          {/* Shelf supports */}
          <div className="absolute top-20 left-10 w-2 h-60 bg-white"></div>
          <div className="absolute top-20 left-68 w-2 h-60 bg-white"></div>
          
          {/* Boxes */}
          <div className="absolute top-24 left-20 w-16 h-12 bg-white rounded"></div>
          <div className="absolute top-24 left-40 w-14 h-14 bg-white rounded"></div>
          <div className="absolute top-44 left-15 w-12 h-12 bg-white rounded"></div>
          <div className="absolute top-44 left-35 w-18 h-12 bg-white rounded"></div>
          
          {/* Warehouse elements */}
          <div className="absolute bottom-20 right-20 w-40 h-40 border-8 border-dashed border-white/40 rounded-lg"></div>
        </div>
        
        {/* Forklift animation */}
        <div className="absolute animate-forklift-move left-0 bottom-10">
          <div className="relative w-24 h-20">
            <div className="absolute bottom-0 left-0 w-20 h-8 bg-amber-400 rounded-sm"></div>
            <div className="absolute bottom-8 left-4 w-12 h-10 bg-amber-500 rounded-t-md"></div>
            <div className="absolute bottom-0 left-0 w-5 h-5 bg-gray-200 rounded-full"></div>
            <div className="absolute bottom-0 left-14 w-5 h-5 bg-gray-200 rounded-full"></div>
            <div className="absolute bottom-5 left-1 w-18 h-1 bg-white"></div>
            <div className="absolute bottom-4 left-0 w-2 h-12 bg-white"></div>
            <div className="absolute bottom-10 left-1 w-10 h-1 bg-white"></div>
            <div className="absolute bottom-16 left-1 w-10 h-1 bg-white"></div>
          </div>
        </div>
        
        <div className="max-w-md mx-auto text-center relative z-10">
          <Image 
            src="/favicon.png" 
            alt="American Wholesalers Logo" 
            width={120} 
            height={120} 
            className="mx-auto mb-8 animate-pulse"
          />
          <h1 className="text-4xl font-bold mb-6">American Wholesalers</h1>
          <p className="text-xl mb-8 text-blue-100">
            Premium wholesale supplies for Upstate NY's finest establishments
          </p>
        </div>
      </div>
      
      {/* Right Side - Loading UI */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="max-w-md w-full">
          <div className="md:hidden mb-8 text-center">
            <Image 
              src="/favicon.png" 
              alt="American Wholesalers Logo" 
              width={80} 
              height={80} 
              className="mx-auto mb-4 animate-pulse"
            />
            <h1 className="text-2xl font-bold text-blue-900">American Wholesalers</h1>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 md:text-center">
              Preparing Your Account...
            </h2>
            
            <div className="space-y-6">
              {/* Progress bar */}
              <div className="relative">
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-sm text-gray-500 text-right">{Math.round(loadingProgress)}%</div>
              </div>
              
              {/* Loading message */}
              <div className="text-center py-3">
                <LoadingMessage />
              </div>
              
              {/* Simulated form placeholders (loading skeletons) */}
              <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-gray-100 rounded"></div>
                <div className="h-10 bg-gray-100 rounded"></div>
                <div className="h-10 bg-blue-100 rounded"></div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} American Wholesalers. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Rotating loading messages component
function LoadingMessage() {
  const messages = [
    "Preparing secure login...",
    "Loading account options...",
    "Setting up your catalog access...",
    "Almost ready...",
    "Checking credentials..."
  ]
  
  const [messageIndex, setMessageIndex] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length)
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])
  
  return <p className="text-blue-600">{messages[messageIndex]}</p>
}