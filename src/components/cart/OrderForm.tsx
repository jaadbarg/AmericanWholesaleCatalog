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
    const [orderWindow, setOrderWindow] = useState(isWithinOrderWindow())

    const [notes, setNotes] = useState('')
    const nextDeliveryDate = getNextBusinessDay().toISOString().split('T')[0]
    const [deliveryDate, setDeliveryDate] = useState(nextDeliveryDate)
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
      if (!isWithinOrderWindow()) {
        setError('Orders are only accepted before 3:00 PM for next-day delivery')
        return
      }
  
      setLoading(true)
      setError(null)
  
      try {
        // 1. Get current user's profile and customer_id
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('Not authenticated')
  
        const { data: profile } = await supabase
          .from('profiles')
          .select('customer_id')
          .eq('id', session.user.id)
          .single()
  
        if (!profile?.customer_id) throw new Error('No customer profile found')
  
        // 2. Create the order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_id: profile.customer_id,
            status: 'pending',
            delivery_date: deliveryDate,
            notes: notes.trim() || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()
  
        if (orderError) throw orderError
  
        // 3. Create order items
        const orderItems = items.map(item => ({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity,
          created_at: new Date().toISOString()
        }))
  
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems)
  
        if (itemsError) {
          // If there's an error with order items, delete the order to maintain consistency
          await supabase
            .from('orders')
            .delete()
            .eq('id', order.id)
          
          throw itemsError
        }
  
        // 4. Success! Clear cart and redirect
        clearCart()
        router.push('/dashboard/orders')
        router.refresh()
  
      } catch (e) {
        console.error('Order submission error:', e)
        setError(e instanceof Error ? e.message : 'Failed to place order')
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
    
            <div>
                <label 
                htmlFor="notes" 
                className="block text-sm font-medium text-gray-700 mb-1"
            >
                Order Notes
            </label>
            <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Any special instructions for your order?"
            />
            </div>
           
    
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