// src/app/(protected)/cart/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import CartSummary from '@/components/cart/CartSummary'
import OrderForm from '@/components/cart/OrderForm'
import { useCart } from '@/hooks/useCart'
import { ArrowLeft } from 'lucide-react'

export default function CartPage() {
  const router = useRouter()
  const items = useCart((state) => state.items)

  return (
    <div className="max-w-4xl mx-auto py-8">
      <button 
        onClick={() => router.back()}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Products
      </button>

      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Cart Items</h2>
          <CartSummary />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Order Details</h2>
          {items.length > 0 ? (
            <OrderForm />
          ) : (
            <p className="text-gray-500">Add some items to your cart to place an order.</p>
          )}
        </div>
      </div>
    </div>
  )
}