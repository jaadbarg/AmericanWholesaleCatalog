// src/components/cart/EnhancedOrderForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { isWithinOrderWindow, getNextBusinessDay } from '@/lib/utils/orderUtils'
import { AlertCircle, Calendar, FileText, Check, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TextArea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { sendOrderConfirmationEmail, sendNewOrderNotificationToAdmin } from '@/lib/utils/emailUtils'

export function EnhancedOrderForm() {
    const router = useRouter()
    const supabase = createClientComponentClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { items, clearCart } = useCart()
    const [orderWindow, setOrderWindow] = useState(isWithinOrderWindow())

    const [notes, setNotes] = useState('')
    const nextDeliveryDate = getNextBusinessDay().toISOString().split('T')[0]
    const [deliveryDate, setDeliveryDate] = useState(nextDeliveryDate)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    useEffect(() => {
      const interval = setInterval(() => {
        setOrderWindow(isWithinOrderWindow())
      }, 60000)

      return () => clearInterval(interval)
    }, [])

    useEffect(() => {
      const nextBusinessDay = getNextBusinessDay()
      setDeliveryDate(nextBusinessDay.toISOString().split('T')[0])
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!isWithinOrderWindow().allowed) {
        setError('Orders are only accepted before 3:00 PM for next-day delivery')
        return
      }
  
      setLoading(true)
      setError(null)
      setIsSubmitting(true)
  
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
  
        // 5. Success! Show success state then clear cart and redirect
        setIsSuccess(true)
        
        setTimeout(() => {
          clearCart()
          router.push('/dashboard/orders')
          router.refresh()
        }, 2000)
  
      } catch (e) {
        console.error('Order submission error:', e)
        setError(e instanceof Error ? e.message : 'Failed to place order')
        setIsSubmitting(false)
      } finally {
        setLoading(false)
      }
    }

    // Success state
    if (isSuccess) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h3>
          <p className="text-gray-600 mb-6">
            Your order has been received and is being processed.
            You'll receive an email confirmation shortly.
          </p>
          <div className="text-sm text-gray-500">
            Redirecting to your orders page...
          </div>
        </motion.div>
      )
    }
  
    return (
        <div className="space-y-6">
          <div className={`p-4 rounded-lg border ${orderWindow.allowed ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
            <div className="flex items-center">
              {orderWindow.allowed ? (
                <Clock className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
              )}
              <p className={`text-sm ${orderWindow.allowed ? 'text-green-700' : 'text-amber-700'}`}>
                {orderWindow.message}
              </p>
            </div>
          </div>
    
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm flex items-start"
              >
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
    
            <div>
              <label 
                htmlFor="delivery-date" 
                className="flex items-center text-sm font-medium text-gray-700 mb-1"
              >
                <Calendar className="h-4 w-4 mr-1 text-gray-400" />
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
              <p className="mt-1 text-xs text-gray-500">
                Select your preferred delivery date (business days only)
              </p>
            </div>
    
            <div>
              <label 
                htmlFor="notes" 
                className="flex items-center text-sm font-medium text-gray-700 mb-1"
              >
                <FileText className="h-4 w-4 mr-1 text-gray-400" />
                Order Notes (Optional)
              </label>
              <TextArea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any special instructions for your order?"
              />
            </div>
    
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-gray-600">Total Items:</span>
                <Badge variant="primary" size="md">
                  {items.reduce((acc, item) => acc + item.quantity, 0)} items
                </Badge>
              </div>
              
              <Button
                type="submit"
                disabled={loading || items.length === 0 || !orderWindow.allowed || isSubmitting}
                fullWidth
                icon={isSubmitting ? <Clock className="animate-spin" /> : <Check />}
                isLoading={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : orderWindow.allowed ? 'Place Order' : 'Ordering Closed'}
              </Button>
            </div>
          </form>
        </div>
    )
}