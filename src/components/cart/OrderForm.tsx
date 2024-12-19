// src/components/cart/OrderForm.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function OrderForm() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { items, clearCart } = useCart()
  const [deliveryDate, setDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Get the current user's profile
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('customer_id')
        .eq('id', session.user.id)
        .single()

      if (!profile?.customer_id) throw new Error('No customer ID found')

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: profile.customer_id,
          status: 'pending',
          delivery_date: deliveryDate || null,
          notes: notes || null
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Clear the cart and redirect
      clearCart()
      router.push('/dashboard/orders')

    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
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
          min={new Date().toISOString().split('T')[0]} // Prevents selecting past dates
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
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special instructions for your order?"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-2">Order Summary</h3>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.item_number} × {item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      <motion.button
        type="submit"
        disabled={loading || items.length === 0}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
      >
        {loading ? 'Placing Order...' : 'Place Order'}
      </motion.button>
    </form>
  )
}