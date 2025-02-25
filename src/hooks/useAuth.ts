// src/hooks/useAuth.ts

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useState } from 'react'

export function useAuth() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const {  error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError

      // If sign-in is successful, go to the dashboard
      router.push('/dashboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)

      // First, check if there's an active session
      const { data: { session } } = await supabase.auth.getSession()

      // If no session, just redirect to sign-in
      if (!session) {
        router.push('/auth/signin')
        return
      }

      // Otherwise, attempt to sign out
      const { error: signOutError } = await supabase.auth.signOut()
      // If there's an error and it's NOT the "session_not_found" message, handle it
      if (signOutError && signOutError.message !== 'Session from session_id claim in JWT does not exist') {
        throw signOutError
      }

      // If we get here, sign out was either successful or the session was already invalid
      router.push('/auth/signin')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return {
    signIn,
    signOut,
    loading,
    error,
  }
}
