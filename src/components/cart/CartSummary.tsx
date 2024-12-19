// src/components/cart/CartSummary.tsx
'use client'

import { motion } from 'framer-motion'
import { Trash2, Plus, Minus } from 'lucide-react'
import { useCart } from '@/hooks/useCart'

export default function CartSummary() { 
    const { items, removeItem, updateQuantity } = useCart()

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Your cart is empty</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <motion.div
          key={item.id}
          className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex-1">
            <h3 className="font-semibold">{item.item_number}</h3>
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              onClick={() => removeItem(item.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}