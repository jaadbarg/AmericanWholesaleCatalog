// src/components/cart/OrderForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { isWithinOrderWindow, getNextBusinessDay } from '@/lib/utils/orderUtils'
import { AlertCircle } from 'lucide-react'

export default function OrderForm() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { items, clearCart } = useCart()
  const [deliveryDate, setDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [orderWindow, setOrderWindow] = useState(isWithinOrderWindow())

  // Update order window status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setOrderWindow(isWithinOrderWindow())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Set initial delivery date to next business day
  useEffect(() => {
    const nextBusinessDay = getNextBusinessDay()
    setDeliveryDate(nextBusinessDay.toISOString().split('T')[0])
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if within order window
    const { allowed, message } = isWithinOrderWindow()
    if (!allowed) {
      setError(message)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // ... rest of the order submission code remains the same ...
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Order Window Status Banner */}
      <div className={`p-4 rounded-lg ${orderWindow.allowed ? 'bg-green-50' : 'bg-yellow-50'}`}>
        <div className="flex items-center">
          <AlertCircle className={`h-5 w-5 ${orderWindow.allowed ? 'text-green-400' : 'text-yellow-400'} mr-2`} />
          <p className={`text-sm ${orderWindow.allowed ? 'text-green-700' : 'text-yellow-700'}`}>
            {orderWindow.message}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label 
            htmlFor="delivery-date" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Delivery Date
          </label>
          <input
            id="delivery-date"
            type="date"
            required
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            min={getNextBusinessDay().toISOString().split('T')[0]}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* ... rest of the form remains the same ... */}

        <motion.button
          type="submit"
          disabled={loading || items.length === 0 || !orderWindow.allowed}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
        >
          {loading ? 'Placing Order...' : orderWindow.allowed ? 'Place Order' : 'Ordering Closed'}
        </motion.button>
      </form>
    </div>
  )
}