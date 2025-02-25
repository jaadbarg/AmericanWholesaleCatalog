// src/app/(protected)/cart/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { EnhancedCartSummary } from '@/components/cart/EnhancedCartSummary'
import { EnhancedOrderForm } from '@/components/cart/EnhancedOrderForm'
import { useCart } from '@/hooks/useCart'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

export default function CartPage() {
  const router = useRouter()
  const items = useCart((state) => state.items)

  return (
    <div className="max-w-5xl mx-auto py-8">
      <Button 
        onClick={() => router.back()}
        variant="ghost"
        size="sm"
        className="mb-6 text-gray-600 hover:text-gray-900"
        icon={<ArrowLeft className="h-4 w-4" />}
      >
        Back to Products
      </Button>

      <div className="flex items-center gap-4 mb-8">
        <ShoppingCart className="h-7 w-7 text-blue-900" />
        <h1 className="text-3xl font-bold text-blue-900">Your Cart</h1>
      </div>

      {items.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200"
        >
          <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-500 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some items to your cart to place an order.</p>
          <Button 
            onClick={() => router.push('/products')}
            size="lg"
          >
            Browse Products
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Cart Items</h2>
                <EnhancedCartSummary />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Order Details</h2>
                <EnhancedOrderForm />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}