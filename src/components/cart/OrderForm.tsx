// src/components/cart/OrderForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { isWithinOrderWindow, getNextBusinessDay, getValidBusinessDays } from '@/lib/utils/orderUtils'
import { AlertCircle } from 'lucide-react'
import { sendOrderConfirmationEmail, sendNewOrderNotificationToAdmin } from '@/lib/utils/emailUtils'

export default function OrderForm() {
    const router = useRouter()
    const supabase = createClientComponentClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { items, clearCart } = useCart()
    const [orderWindow, setOrderWindow] = useState(isWithinOrderWindow())
    const [notes, setNotes] = useState('')
    const [validDeliveryDates, setValidDeliveryDates] = useState<Date[]>([])
    const [deliveryDate, setDeliveryDate] = useState('')

    // Check order window status on mount and every 5 minutes
    useEffect(() => {
      // Initial check
      setOrderWindow(isWithinOrderWindow())
      
      // Set up interval - 5 minutes is enough for order window changes
      const interval = setInterval(() => {
        const currentWindow = isWithinOrderWindow()
        setOrderWindow(currentWindow)
        
        // If the order window closes, we need to update delivery dates
        if (!currentWindow.allowed) {
          updateValidDeliveryDates()
        }
      }, 5 * 60 * 1000) // 5 minutes

      return () => clearInterval(interval)
    }, [])

    // Generate valid delivery dates that are business days
    const updateValidDeliveryDates = () => {
      const validDates = getValidBusinessDays(30) // Get next 30 days of valid business days
      setValidDeliveryDates(validDates)
      
      // Set default to next business day
      const nextBusinessDay = getNextBusinessDay()
      setDeliveryDate(nextBusinessDay.toISOString().split('T')[0])
    }

    // Initialize delivery dates on component mount
    useEffect(() => {
      updateValidDeliveryDates()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!isWithinOrderWindow().allowed) {
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

        // Get customer details for email
        const { data: customer } = await supabase
          .from('customers')
          .select('name, email')
          .eq('id', profile.customer_id)
          .single()

        if (!customer) throw new Error('Customer details not found')
  
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

        // 4. Send emails
        const emailDetails = {
          orderNumber: order.id.slice(0, 8),
          customerEmail: customer.email,
          customerName: customer.name,
          items: items.map(item => ({
            item_number: item.item_number,
            description: item.description,
            quantity: item.quantity
          })),
          deliveryDate: new Date(deliveryDate).toLocaleDateString(),
          notes: notes || undefined
        }

        await Promise.all([
          sendOrderConfirmationEmail(emailDetails),
          sendNewOrderNotificationToAdmin(emailDetails)
        ])
  
        // 5. Success! Clear cart and redirect
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
              <select
                id="delivery-date"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {validDeliveryDates.map((date) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const displayDate = date.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  });
                  
                  return (
                    <option key={dateStr} value={dateStr}>
                      {displayDate}
                    </option>
                  );
                })}
                
                {validDeliveryDates.length === 0 && (
                  <option value="">Loading delivery dates...</option>
                )}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Only business days are available for delivery
              </p>
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