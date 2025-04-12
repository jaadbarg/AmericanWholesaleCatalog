// src/components/auth/SignInForm.tsx - WITH RATE LIMITING
"use client"

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion } from 'framer-motion'

// Rate limiting settings
const RATE_LIMIT_ATTEMPTS = 3
const RATE_LIMIT_WINDOW_MS = 60000 // 1 minute
const RATE_LIMIT_COOLDOWN_MS = 30000 // 30 seconds

export function SignInForm() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Rate limiting state
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [cooldownTime, setCooldownTime] = useState(0)
  
  // Handle countdown timer for rate limit
  useEffect(() => {
    let timer: NodeJS.Timeout
    
    if (isRateLimited && cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime(prev => {
          const newTime = prev - 1
          if (newTime <= 0) {
            setIsRateLimited(false)
            clearInterval(timer)
            return 0
          }
          return newTime
        })
      }, 1000)
    }
    
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isRateLimited, cooldownTime])
  
  // Reset attempts after window expires
  useEffect(() => {
    const resetTimer = setTimeout(() => {
      if (loginAttempts > 0) {
        setLoginAttempts(0)
      }
    }, RATE_LIMIT_WINDOW_MS)
    
    return () => clearTimeout(resetTimer)
  }, [loginAttempts])

  // Use useCallback to ensure the function doesn't get recreated on every render
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if rate limited
    if (isRateLimited) {
      setError(`Too many login attempts. Please wait ${cooldownTime} seconds before trying again.`)
      return
    }

    // Prevent multiple submissions
    if (loading) return
    
    // Track attempt
    setLoginAttempts(prev => prev + 1)
    
    // Check if exceeded rate limit
    if (loginAttempts >= RATE_LIMIT_ATTEMPTS) {
      setIsRateLimited(true)
      setCooldownTime(RATE_LIMIT_COOLDOWN_MS / 1000)
      setError(`Too many login attempts. Please wait ${RATE_LIMIT_COOLDOWN_MS / 1000} seconds before trying again.`)
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw error
      }

      // Reset login attempts on success
      setLoginAttempts(0)
      
      // Navigate only once
      router.push('/products')
      
      // Use refresh only after redirection to avoid multiple auth attempts
      setTimeout(() => {
        router.refresh()
      }, 100)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred during sign in')
    } finally {
      setLoading(false)
    }
  }, [email, password, loading, router, supabase.auth, loginAttempts, isRateLimited, cooldownTime])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <motion.div 
          className="bg-red-50 text-red-500 p-4 rounded-lg text-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}
      
      {isRateLimited && (
        <motion.div 
          className="bg-amber-50 text-amber-700 p-4 rounded-lg text-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <span>Please wait before trying again</span>
            <span className="font-mono bg-amber-100 px-2 py-1 rounded">{cooldownTime}s</span>
          </div>
          <div className="mt-2 w-full bg-amber-200 rounded-full h-1.5">
            <div 
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-300" 
              style={{ width: `${(cooldownTime / (RATE_LIMIT_COOLDOWN_MS / 1000)) * 100}%` }}
            ></div>
          </div>
        </motion.div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={loading || isRateLimited}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={loading || isRateLimited}
        />
      </div>

      {!isRateLimited && loginAttempts > 0 && (
        <div className="text-xs text-amber-600">
          Login attempts: {loginAttempts}/{RATE_LIMIT_ATTEMPTS}
        </div>
      )}

      <motion.button
        type="submit"
        disabled={loading || isRateLimited || !email || !password}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: (loading || isRateLimited) ? 1 : 1.01 }}
        whileTap={{ scale: (loading || isRateLimited) ? 1 : 0.99 }}
      >
        {loading ? (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : isRateLimited ? (
          'Try again later'
        ) : (
          'Sign in'
        )}
      </motion.button>
    </form>
  )
}