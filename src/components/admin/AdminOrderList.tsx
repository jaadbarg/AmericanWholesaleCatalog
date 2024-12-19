// src/components/admin/AdminOrderList.tsx
'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion } from 'framer-motion'
import { Check, X, ChevronDown } from 'lucide-react'

type OrderItem = {
  quantity: number
  products: {
    id: string
    item_number: string
    description: string
  }
}

type Order = {
  id: string
  created_at: string
  delivery_date: string
  notes: string | null
  status: string
  customers: {
    name: string
    email: string
  }
  order_items: OrderItem[]
}

export default function AdminOrderList({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const handleOrderAction = async (orderId: string, newStatus: 'confirmed' | 'cancelled') => {
    setLoading(orderId)
    setError(null)

    try {
      // Update the order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (updateError) throw updateError

      // Find the order that was just updated
      const updatedOrder = orders.find(o => o.id === orderId)
      if (!updatedOrder) throw new Error('Order not found')

      // Send confirmation email (this would be handled by your email service)
      // For now, we'll just log it
      console.log(`Email would be sent to ${updatedOrder.customers.email}:
        Subject: Order ${newStatus === 'confirmed' ? 'Confirmed' : 'Cancelled'}
        Order ID: ${orderId}
        Delivery Date: ${new Date(updatedOrder.delivery_date).toLocaleDateString()}
      `)

      // Update local state to remove the processed order
      setOrders(orders.filter(order => order.id !== orderId))

    } catch (e) {
      console.error('Error processing order:', e)
      setError(e instanceof Error ? e.message : 'An error occurred while processing the order')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No pending orders</p>
        </div>
      ) : (
        orders.map((order) => (
          <motion.div
            key={order.id}
            className="bg-white rounded-lg shadow-sm border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Order #{order.id.slice(0, 8)}...</h3>
                  <p className="text-sm text-gray-500">{order.customers.name}</p>
                  <p className="text-sm text-gray-500">{order.customers.email}</p>
                  <p className="text-sm text-gray-500">
                    Delivery: {new Date(order.delivery_date).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOrderAction(order.id, 'confirmed')}
                    disabled={loading === order.id}
                    className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check size={20} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOrderAction(order.id, 'cancelled')}
                    disabled={loading === order.id}
                    className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={20} />
                  </motion.button>
                  <button
                    onClick={() => setExpandedOrder(
                      expandedOrder === order.id ? null : order.id
                    )}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <ChevronDown 
                      className={`transform transition-transform ${
                        expandedOrder === order.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {expandedOrder === order.id && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-medium mb-2">Order Items:</h4>
                  <ul className="space-y-2">
                    {order.order_items.map((item, index) => (
                      <li key={index} className="text-sm">
                        {item.quantity}x {item.products.item_number} - {item.products.description}
                      </li>
                    ))}
                  </ul>
                  {order.notes && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Notes:</h4>
                      <p className="text-sm text-gray-600">{order.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))
      )}
    </div>
  )
}