// src/app/auth/signin/page.tsx
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { EnhancedSignInForm } from '@/components/auth/EnhancedSignInForm'

export default async function SignIn() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/products')
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Brand */}
      <div className="hidden md:flex md:w-1/2 bg-blue-900 text-white flex-col justify-center items-center p-8">
        <div className="max-w-md mx-auto text-center">
          <Image 
            src="/favicon.png" 
            alt="American Wholesalers Logo" 
            width={120} 
            height={120} 
            className="mx-auto mb-8"
          />
          <h1 className="text-4xl font-bold mb-6">American Wholesalers</h1>
          <p className="text-xl mb-8 text-blue-100">
            Premium wholesale supplies for Upstate NY's finest establishments
          </p>
          {/* <div className="bg-blue-800/50 rounded-lg p-6 backdrop-blur-sm">
            <p className="italic text-blue-200">
              "American Wholesalers has been a trusted partner for our restaurant for over 10 years. Their convenient ordering system and reliable delivery make them an essential part of our success."
            </p>
            <p className="mt-4 font-medium">— John Smith, Executive Chef</p>
          </div> */}
        </div>
      </div>
      
      {/* Right Side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="md:hidden mb-8 text-center">
            <Image 
              src="/favicon.png" 
              alt="American Wholesalers Logo" 
              width={80} 
              height={80} 
              className="mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-blue-900">American Wholesalers</h1>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 md:text-center">
              Sign in to your account
            </h2>
            <EnhancedSignInForm />
            
            <div className="mt-8 text-sm text-center text-gray-500">
              <p>
                Need help? Contact{' '}
                <a href="mailto:support@americanwholesalers.com" className="text-blue-600 hover:text-blue-800">
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