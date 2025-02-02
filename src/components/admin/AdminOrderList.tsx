// src/components/admin/AdminOrderList.tsx
'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion } from 'framer-motion'
import { Check, X, ChevronDown } from 'lucide-react'
import { sendOrderApprovalEmail } from '@/lib/utils/emailUtils'

type OrderItem = {
  id: string
  quantity: number
  product_id: string
  product: {
    id: string
    item_number: string
    description: string
  } | null
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
  } | null
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
      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (updateError) throw updateError

      // Find the order for email notification
      const updatedOrder = orders.find(o => o.id === orderId)
      
      if (updatedOrder && updatedOrder.customers && newStatus === 'confirmed') {
        // Send confirmation email
        try {
          await sendOrderApprovalEmail({
            orderNumber: updatedOrder.id.slice(0, 8),
            customerEmail: updatedOrder.customers.email,
            customerName: updatedOrder.customers.name,
            items: updatedOrder.order_items
              .filter(item => item.product) // Ensure product is not null
              .map(item => ({
                item_number: item.product!.item_number,
                description: item.product!.description,
                quantity: item.quantity
              })),
            deliveryDate: new Date(updatedOrder.delivery_date).toLocaleDateString(),
            notes: updatedOrder.notes || undefined
          })
          console.log('sent it')
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError)
        }
      }

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
        <div>
          <p className="text-sm text-gray-600 mb-4">
            {orders.length} pending order{orders.length !== 1 ? 's' : ''} to review
          </p>
          {orders.map((order) => (
            <motion.div
              key={order.id}
              className="bg-white rounded-lg shadow-sm border mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Order #{order.id.slice(0, 8)}...</h3>
                    {order.customers && (
                      <>
                        <p className="text-sm text-gray-500">{order.customers.name}</p>
                        <p className="text-sm text-gray-500">{order.customers.email}</p>
                      </>
                    )}
                    <p className="text-sm text-gray-500">
                      Delivery: {new Date(order.delivery_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Ordered: {new Date(order.created_at).toLocaleString()}
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
                      title="Confirm Order"
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
                      title="Cancel Order"
                    >
                      <X size={20} />
                    </motion.button>
                    <button
                      onClick={() => setExpandedOrder(
                        expandedOrder === order.id ? null : order.id
                      )}
                      className="p-2 hover:bg-gray-100 rounded-full"
                      title="Show Details"
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
                      {order.order_items.map((item) => (
                        <li key={item.id} className="text-sm">
                          {item.product ? (
                            <>
                              {item.quantity}x {item.product.item_number} - {item.product.description}
                            </>
                          ) : (
                            <span className="text-gray-500">Product information not available</span>
                          )}
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

                {loading === order.id && (
                  <div className="mt-2 text-sm text-blue-600">
                    Processing order...
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
