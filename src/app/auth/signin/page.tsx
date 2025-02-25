// src/app/auth/signin/page.tsx
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { SignInForm } from '@/components/auth/SignInForm'

export default async function SignIn() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/products')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="flex flex-col items-center">
          <Image 
            src="/favicon.png" 
            alt="American Wholesalers Logo" 
            width={80} 
            height={80} 
            className="mx-auto"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome to American Wholesalers
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  )
}
