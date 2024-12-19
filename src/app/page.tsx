// src/app/page.tsx
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()

  // If user is logged in, redirect to products page
  if (session) {
    redirect('/products')
  }

  // If not logged in, redirect to sign in page
  redirect('/auth/signin')
}