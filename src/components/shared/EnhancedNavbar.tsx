// src/components/shared/EnhancedNavbar.tsx
"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useCart } from '@/hooks/useCart'
import { isAdmin } from '@/lib/utils/adminUtils'
import { 
  ShoppingCart, 
  User, 
  LogOut, 
  Package, 
  Home, 
  Menu, 
  X, 
  ChevronDown,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function EnhancedNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { items, clearCart } = useCart()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [loading, setLoading] = useState(false)

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUserEmail(session?.user?.email || null)
      
      // Get customer name if available
      if (session?.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('customer_id')
          .eq('id', session.user.id)
          .single()
          
        if (profile?.customer_id) {
          const { data: customer } = await supabase
            .from('customers')
            .select('name')
            .eq('id', profile.customer_id)
            .single()
            
          if (customer) {
            setUserName(customer.name)
          }
        }
      }
    }
    getUser()
  }, [supabase])

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    try {
      setLoading(true)
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      clearCart()
      
      // Add a delay to ensure signout completes before redirect
      setTimeout(() => {
        // Force a hard refresh to ensure cookies are cleared
        window.location.href = '/auth/signin'
      }, 300)
    } catch (error) {
      console.error('Error signing out:', error)
      setLoading(false)
    }
  }

  const isAdminUser = userEmail && isAdmin(userEmail)
  
  // Close menus when route changes
  useEffect(() => {
    setIsMenuOpen(false)
    setIsUserMenuOpen(false)
  }, [pathname])

  // Define nav links based on user type
  const navLinks = isAdminUser
    ? [
        { 
          href: '/admin', 
          label: 'Admin Dashboard', 
          icon: <Shield size={18} className="mr-2" />,
          active: pathname === '/admin'
        },
        { 
          href: '/admin/orders', 
          label: 'Orders', 
          icon: <Package size={18} className="mr-2" />,
          active: pathname.startsWith('/admin/orders')
        },
        { 
          href: '/admin/customers', 
          label: 'Customers', 
          icon: <User size={18} className="mr-2" />,
          active: pathname.startsWith('/admin/customers') 
        }
      ]
    : [
        { 
          href: '/products', 
          label: 'Products', 
          icon: <Home size={18} className="mr-2" />,
          active: pathname === '/products'
        },
        { 
          href: '/dashboard/orders', 
          label: 'Orders', 
          icon: <Package size={18} className="mr-2" />,
          active: pathname === '/dashboard/orders' 
        }
      ];

  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
          scrolled ? "bg-american-navy-800 shadow-md" : "bg-american-navy-900/95 backdrop-blur-md"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 flex-nowrap">
            {/* Logo */}
            <Link 
              href={isAdminUser ? "/admin/orders" : "/products"} 
              className="flex items-center space-x-2 font-bold text-xl text-white flex-shrink-0 mr-6 min-w-[180px]"
            >
              {/* Logo - using external image directly */}
              <img 
                src="https://lirp.cdn-website.com/7b78f399/dms3rep/multi/opt/logo-4403aa5f-204w.png" 
                alt="American Wholesalers Logo" 
                className="h-14 w-auto bg-white p-1 rounded-md max-w-[300px] object-contain"
              />
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-1 flex-shrink overflow-x-hidden">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    link.active 
                      ? 'bg-white text-american-navy-800' 
                      : 'text-white hover:bg-american-navy-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop right section */}
            <div className="hidden md:flex items-center space-x-2 flex-shrink-0">
              {!isAdminUser && (
                <div className="flex items-center space-x-2">
                  <Link href="/products/ai-mode">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full text-white text-sm shadow-lg"
                    >
                      <svg className="h-4 w-4 mr-1.5 text-yellow-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 9L12 2L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 2V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5 22L5 22.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 22L9 22.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M13 22L13 22.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M17 22L17 22.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      AI Mode
                    </motion.div>
                  </Link>
                  
                  <Link href="/cart">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative p-2 text-white hover:bg-american-navy-700 rounded-full"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      {itemCount > 0 && (
                        <Badge
                          variant="american"
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0"
                        >
                          {itemCount}
                        </Badge>
                      )}
                    </motion.div>
                  </Link>
                </div>
              )}

              {/* User menu */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 bg-american-navy-700 hover:bg-american-navy-600 rounded-full py-1.5 px-3 text-sm font-medium text-white"
                >
                  <User size={18} />
                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {userName || userEmail?.split('@')[0] || 'Account'}
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={`transform transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} 
                  />
                </motion.button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-56 rounded-lg bg-white shadow-lg z-50 border overflow-hidden"
                    >
                      <div className="p-2 border-b">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {userName || 'Welcome'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                      </div>
                      <div className="p-1">
                        <Link 
                          href="/profile" 
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                          <User size={16} className="mr-2 text-gray-500" />
                          My Profile
                        </Link>
                        <button
                          onClick={handleSignOut}
                          disabled={loading}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                          <LogOut size={16} className="mr-2 text-american-navy-600" />
                          {loading ? 'Signing out...' : 'Sign Out'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center space-x-1 flex-shrink-0 ml-2">
              {!isAdminUser && (
                <>
                  <Link href="/products/ai-mode">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center p-1.5 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full text-white"
                    >
                      <svg className="h-4 w-4 text-yellow-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 9L12 2L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 2V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5 22L5 22.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 22L9 22.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M13 22L13 22.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M17 22L17 22.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.div>
                  </Link>
                  
                  <Link href="/cart">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative p-2 text-white hover:bg-american-navy-700 rounded-full"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      {itemCount > 0 && (
                        <Badge
                          variant="american"
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0"
                        >
                          {itemCount}
                        </Badge>
                      )}
                    </motion.div>
                  </Link>
                </>
              )}
              
              <motion.button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-md text-white hover:bg-american-navy-700"
                aria-label="Menu"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 bg-american-navy-800 z-20 border-b border-american-navy-600 shadow-lg md:hidden"
          >
            <div className="container mx-auto px-4 py-3">
              <div className="space-y-1 pb-3">
                {navLinks.map((link) => (
                  <Link 
                    key={link.href}
                    href={link.href}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                      link.active 
                        ? 'bg-white text-american-navy-800' 
                        : 'text-white hover:bg-american-navy-700'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
                
                <Link 
                  href="/profile" 
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                    pathname === '/profile' 
                      ? 'bg-white text-american-navy-800' 
                      : 'text-white hover:bg-american-navy-700'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User size={18} className="mr-2" />
                  My Profile
                </Link>
              </div>
              
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={handleSignOut}
                  icon={loading ? undefined : <LogOut size={18} />}
                  className="justify-center"
                  isLoading={loading}
                  disabled={loading}
                >
                  {loading ? 'Signing out...' : 'Sign Out'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Background overlay when mobile menu is open */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-10 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}