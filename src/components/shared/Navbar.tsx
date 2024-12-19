// src/components/shared/Navbar.tsx
"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b"
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/products" className="font-bold text-xl text-blue-900">
            American Wholesalers
          </Link>
          
          <div className="hidden md:flex space-x-8">
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
              href="/orders" 
              className={`${
                pathname === '/orders' 
                  ? 'text-blue-900 font-medium' 
                  : 'text-gray-600'
              } hover:text-blue-900 transition-colors`}
            >
              Orders
            </Link>
          </div>

          <div className="flex items-center space-x-4">
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
      </div>
    </motion.nav>
  )
}