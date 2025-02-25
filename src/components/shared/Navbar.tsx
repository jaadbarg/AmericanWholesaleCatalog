// src/components/shared/Navbar.tsx
"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useCart } from '@/hooks/useCart'
import { useState, useEffect } from 'react'
import { isAdmin } from '@/lib/utils/adminUtils'
import { CartButton } from '@/components/products/CartButton'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const clearCart = useCart((state) => state.clearCart)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUserEmail(session?.user?.email || null)
    }
    getUser()
  }, [supabase])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      clearCart()
      router.push('/auth/signin')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const isAdminUser = userEmail && isAdmin(userEmail)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-8 left-0 right-0 z-30 bg-white/80 backdrop-blur-md border-b"
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href={isAdminUser ? "/admin/orders" : "/products"} className="font-bold text-xl text-blue-900">
            American Wholesalers
          </Link>
          
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {!isAdminUser && (
              <>
                <Link 
                  href="/products" 
                  className={`${
                    pathname === '/products' 
                      ? 'text-blue-900 font-medium' 
                      : 'text-gray-600'
                  } hover:text-blue-900 transition-colors`}
                >
                  Products
                </Link>
                <Link 
                  href="/dashboard/orders" 
                  className={`${
                    pathname === '/dashboard/orders' 
                      ? 'text-blue-900 font-medium' 
                      : 'text-gray-600'
                  } hover:text-blue-900 transition-colors`}
                >
                  Orders
                </Link>
                <Link 
                  href="/profile" 
                  className={`${
                    pathname === '/profile' 
                      ? 'text-blue-900 font-medium' 
                      : 'text-gray-600'
                  } hover:text-blue-900 transition-colors`}
                >
                  My Profile
                </Link>
              </>
            )}
            {isAdminUser && (
              <Link 
                href="/admin/orders" 
                className={`${
                  pathname === '/admin/orders' 
                    ? 'text-blue-900 font-medium' 
                    : 'text-gray-600'
                } hover:text-blue-900 transition-colors`}
              >
                Admin Panel
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {!isAdminUser && <CartButton />}
            <motion.button
              onClick={handleSignOut}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Sign Out
            </motion.button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <motion.div 
            className="md:hidden absolute left-0 right-0 top-16 bg-white border-b shadow-lg z-40"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="px-4 py-2 space-y-2">
              {!isAdminUser && (
                <>
                  <Link 
                    href="/products" 
                    className="block py-2 text-gray-600 hover:text-blue-900"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Products
                  </Link>
                  <Link 
                    href="/dashboard/orders" 
                    className="block py-2 text-gray-600 hover:text-blue-900"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Orders
                  </Link>
                  <Link 
                    href="/profile" 
                    className="block py-2 text-gray-600 hover:text-blue-900"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                </>
              )}
              {isAdminUser && (
                <Link 
                  href="/admin/orders" 
                  className="block py-2 text-gray-600 hover:text-blue-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
              <div className="pt-2 border-t">
                {!isAdminUser && (
                  <div className="py-2">
                    <CartButton />
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}