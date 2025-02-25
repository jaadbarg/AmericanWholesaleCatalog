// src/app/auth/signin/enhanced-page.tsx
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { EnhancedSignInForm } from '@/components/auth/EnhancedSignInForm'

export default async function EnhancedSignIn() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/products')
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel - Brand imagery */}
      <div className="hidden md:flex md:w-1/2 bg-blue-900 text-white p-8 flex-col justify-between">
        <div>
          <div className="flex items-center">
            <Image 
              src="/favicon.png" 
              alt="Logo" 
              width={40} 
              height={40} 
              className="mr-3"
            />
            <h1 className="text-2xl font-bold">American Wholesalers</h1>
          </div>
          
          <div className="mt-20 max-w-md">
            <h2 className="text-3xl font-bold mb-6">Premium Restaurant Supplies</h2>
            <p className="text-blue-200 text-lg mb-8">
              Serving Upstate NY's finest restaurants with high-quality wholesale products.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-blue-800 p-2 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Local Delivery</h3>
                  <p className="text-blue-200 text-sm">Next-day delivery throughout Upstate NY</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-800 p-2 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Quality Products</h3>
                  <p className="text-blue-200 text-sm">Premium supplies at wholesale prices</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-800 p-2 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Personalized Service</h3>
                  <p className="text-blue-200 text-sm">Custom orders tailored to your needs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-blue-300 text-sm">
          &copy; {new Date().getFullYear()} American Wholesalers. All rights reserved.
        </div>
      </div>
      
      {/* Right panel - Login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center justify-center mb-10">
            <Image 
              src="/favicon.png" 
              alt="American Wholesalers Logo" 
              width={60} 
              height={60} 
              className="mx-auto"
            />
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-gray-600">
              Sign in to your American Wholesalers account
            </p>
          </div>
          
          <EnhancedSignInForm />
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Need help accessing your account?</p>
            <p className="mt-1">Contact us at <a href="mailto:support@americanwholesalers.com" className="text-blue-600 hover:text-blue-800">support@americanwholesalers.com</a></p>
          </div>
        </div>
      </div>
    </div>
  )
}