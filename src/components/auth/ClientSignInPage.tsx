'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { EnhancedSignInForm } from '@/components/auth/EnhancedSignInForm'
import SignInLoading from '@/app/auth/signin/loading'

// Client component that forces the loading animation to show
export default function ClientSignInPage() {
  const [isLoading, setIsLoading] = useState(true)
  
  // Force the loading animation to show for at least 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 3000) // 3 seconds minimum loading time
    
    return () => clearTimeout(timer)
  }, [])
  
  if (isLoading) {
    return <SignInLoading />
  }
  
  return <SignInContent />
}

// Main sign-in content
function SignInContent() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Brand with warehouse theme background */}
      <div className="hidden md:flex md:w-1/2 bg-gray-800 text-white flex-col justify-center items-center p-8 relative overflow-hidden">
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
        
        <div className="max-w-md mx-auto text-center relative z-10">
          <img 
            src="https://lirp.cdn-website.com/7b78f399/dms3rep/multi/opt/logo-4403aa5f-204w.png" 
            alt="American Wholesalers Logo" 
            width={200}
            className="mx-auto mb-8"
          />
          <h1 className="text-4xl font-bold mb-6">American Wholesalers</h1>
          <p className="text-xl mb-8 text-gray-300">
            Premium wholesale supplies for Upstate NY's finest establishments
          </p>
        </div>
      </div>
      
      {/* Right Side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="md:hidden mb-8 text-center">
            <img 
              src="https://lirp.cdn-website.com/7b78f399/dms3rep/multi/opt/logo-4403aa5f-204w.png" 
              alt="American Wholesalers Logo" 
              width={150}
              className="mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-800">American Wholesalers</h1>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 md:text-center">
              Sign in to your account
            </h2>
            <EnhancedSignInForm />
            
            <div className="mt-8 text-sm text-center text-gray-500">
              <p>
                Need help? Contact{' '}
                <a href="mailto:support@americanwholesalers.com" className="text-gray-600 hover:text-gray-800">
                  support@americanwholesalers.com
                </a>
              </p>
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