// src/components/auth/EnhancedSignInForm.tsx
"use client"

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, AlertCircle, LogIn, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function EnhancedSignInForm() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null >(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isFirstAttempt, setIsFirstAttempt] = useState(true)

  // Clear field-specific errors when user starts typing
  useEffect(() => {
    if (email && emailError) setEmailError(null)
  }, [email, emailError])

  useEffect(() => {
    if (password && passwordError) setPasswordError(null)
  }, [password, passwordError])

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return re.test(email)
  }

  // Use useCallback to ensure the function doesn't get recreated on every render
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsFirstAttempt(false)

    // Clear previous errors
    setError(null)
    setEmailError(null)
    setPasswordError(null)
    
    // Validate inputs
    let hasErrors = false
    
    if (!email.trim()) {
      setEmailError('Email is required')
      hasErrors = true
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address')
      hasErrors = true
    }
    
    if (!password) {
      setPasswordError('Password is required')
      hasErrors = true
    }
    
    if (hasErrors) return
    
    // Prevent multiple submissions
    if (loading) return
    
    setLoading(true)

    try {
      // Enhanced debugging
      console.log("Attempting login with:", { 
        email, 
        passwordLength: password.length,
        passwordFirstChar: password.charAt(0),
        passwordLastChar: password.charAt(password.length - 1)
      });
      
      // Force email to lowercase for consistency
      const normalizedEmail = email.toLowerCase().trim();
      
      // First, show a message about the current login attempt
      console.log(`DEBUG LOGIN ATTEMPT - Email: ${normalizedEmail}, Password: ${password}`);
      
      // Try to actually authenticate
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      })
      
      console.log("Login response:", { 
        success: !error, 
        user: data?.user ? data.user.id : null,
        errorMessage: error?.message,
        errorDetails: error,
        userData: data?.user
      });

      if (error) {
        throw error
      }

      // Check if user is admin and redirect accordingly
      const isUserAdmin = normalizedEmail === 'admin@americanwholesalers.us';
      const redirectPath = isUserAdmin ? '/admin' : '/products';
      
      // Navigate only once
      router.push(redirectPath)
      
      // Use refresh only after redirection to avoid multiple auth attempts
      setTimeout(() => {
        router.refresh()
      }, 100)
    } catch (e) {
      console.error('Sign in error:', e)
      
      // Enhanced error handling
      if (e instanceof Error) {
        console.log("Detailed error info:", {
          message: e.message,
          name: e.name,
          stack: e.stack
        });
        
        if (e.message.includes('Invalid login credentials')) {
          setError('The email or password you entered is incorrect. If you just created this account, make sure to use exactly "Welcome123!" as the password.')
        } else if (e.message.includes('Email not confirmed')) {
          setError('Please verify your email address before signing in')
        } else {
          setError(e.message)
        }
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [email, password, loading, router, supabase.auth])

  return (
    <>
      <AnimatePresence mode="wait">
        {error && (
          <motion.div 
            className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-sm mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form 
        onSubmit={handleSubmit} 
        className="space-y-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <Input
            id="email"
            type="email"
            label="Email address"
            error={emailError || undefined}
            icon={<Mail size={18} className="text-gray-400" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="yourname@example.com"
            disabled={loading}
            className={
              !isFirstAttempt && !emailError && email 
                ? "border-green-300 focus:border-green-500 focus:ring-green-500" 
                : ""
            }
          />
        </div>

        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            error={passwordError || undefined}
            icon={<Lock size={18} className="text-gray-400" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? 
              <EyeOff size={18} /> : 
              <Eye size={18} />
            }
          </button>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            className="bg-gray-700 hover:bg-gray-800 text-white"
            fullWidth
            isLoading={loading}
            disabled={loading}
            icon={loading ? undefined : <LogIn size={18} />}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </div>
      </motion.form>
    </>
  )
}