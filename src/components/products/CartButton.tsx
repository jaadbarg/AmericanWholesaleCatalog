// src/components/products/CartButton.tsx
'use client'

import { ShoppingCart } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCart } from '@/hooks/useCart'
import { useRouter } from 'next/navigation'

export function CartButton() {
  const router = useRouter()
  const items = useCart((state) => state.items)
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => router.push('/cart')}
      className="relative flex items-center justify-center p-2"
    >
      <ShoppingCart className="h-6 w-6" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </motion.button>
  )
}