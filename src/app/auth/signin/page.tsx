// src/app/auth/signin/page.tsx
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'
import ClientSignInPage from '@/components/auth/ClientSignInPage'

// This is the server component that handles auth checks
export default async function SignInPage() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/products')
  }

  // Pass control to the client component that manages the loading animation
  return <ClientSignInPage />
}