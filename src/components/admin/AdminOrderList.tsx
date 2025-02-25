// src/components/admin/AdminOrderList.tsx
'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion } from 'framer-motion'
import { Check, X, ChevronDown, AlertCircle, CheckCircle, XCircle, Package, Clock, Calendar, Mail, User } from 'lucide-react'
import { sendOrderApprovalEmail } from '@/lib/utils/emailUtils'
import { format } from 'date-fns'

type OrderItem = {
  id: string
  quantity: number
  product_id: string
  product: {
    id: string
    item_number: string
    description: string
    category?: string
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
  const [actionResult, setActionResult] = useState<{
    orderId: string,
    status: 'success' | 'error',
    message: string,
    action: 'confirmed' | 'cancelled'
  } | null>(null)
  const [confirmingOrder, setConfirmingOrder] = useState<string | null>(null)
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  const handleOrderAction = async (orderId: string, newStatus: 'confirmed' | 'cancelled') => {
    // Start confirmation process
    if (newStatus === 'confirmed' && confirmingOrder !== orderId) {
      setConfirmingOrder(orderId)
      setCancellingOrder(null)
      return
    } else if (newStatus === 'cancelled' && cancellingOrder !== orderId) {
      setCancellingOrder(orderId)
      setConfirmingOrder(null)
      return
    }

    // Reset confirmation states when proceeding
    setConfirmingOrder(null)
    setCancellingOrder(null)
    
    // Start the actual action
    setLoading(orderId)
    setActionResult(null)

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
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError)
          // We continue even if email fails - but we'd log this error
        }
      }

      // Show success message
      setActionResult({
        orderId,
        status: 'success',
        message: newStatus === 'confirmed' 
          ? 'Order confirmed! Customer has been notified.' 
          : 'Order cancelled successfully.',
        action: newStatus
      })

      // Remove the processed order after a delay
      setTimeout(() => {
        setOrders(orders.filter(order => order.id !== orderId))
        setActionResult(null)
      }, 3000)

    } catch (e) {
      console.error('Error processing order:', e)
      setActionResult({
        orderId,
        status: 'error',
        message: e instanceof Error ? e.message : 'An error occurred while processing the order',
        action: newStatus
      })
      setLoading(null)
    }
  }

  // Reset any confirmation dialogs when expanding an order
  const handleToggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
    if (confirmingOrder === orderId) setConfirmingOrder(null)
    if (cancellingOrder === orderId) setCancellingOrder(null)
  }

  return (
    <div className="space-y-6">
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No pending orders</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 rounded-lg mb-6 text-amber-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              You have <span className="font-bold">{orders.length}</span> pending order{orders.length !== 1 ? 's' : ''} to review.
              Approve or reject these orders to notify customers of their status.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Order Header */}
                <div className="border-b border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 p-2 rounded-full">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold flex items-center">
                          Order #{order.id.slice(0, 8)}
                          <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                            Pending
                          </span>
                        </h3>
                        <p className="text-sm text-gray-500">
                          Ordered {format(new Date(order.created_at), 'MMM d, yyyy')} at {format(new Date(order.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                      {/* Confirm Button - with confirmation state */}
                      {confirmingOrder === order.id ? (
                        <motion.button
                          initial={{ scale: 1 }}
                          animate={{ scale: 1.05 }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium"
                          onClick={() => handleOrderAction(order.id, 'confirmed')}
                          disabled={loading === order.id}
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Confirm Now</span>
                        </motion.button>
                      ) : (
                        <button
                          onClick={() => handleOrderAction(order.id, 'confirmed')}
                          disabled={loading === order.id}
                          className={`flex items-center gap-1 px-3 py-1.5 ${
                            cancellingOrder === order.id
                              ? 'bg-gray-100 text-gray-400'
                              : 'bg-green-50 text-green-700 hover:bg-green-100'
                          } rounded-md text-sm font-medium transition-colors`}
                        >
                          <Check className="h-4 w-4" />
                          <span>Confirm</span>
                        </button>
                      )}
                      
                      {/* Cancel Button - with confirmation state */}
                      {cancellingOrder === order.id ? (
                        <motion.button
                          initial={{ scale: 1 }}
                          animate={{ scale: 1.05 }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium"
                          onClick={() => handleOrderAction(order.id, 'cancelled')}
                          disabled={loading === order.id}
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Cancel Now</span>
                        </motion.button>
                      ) : (
                        <button
                          onClick={() => handleOrderAction(order.id, 'cancelled')}
                          disabled={loading === order.id}
                          className={`flex items-center gap-1 px-3 py-1.5 ${
                            confirmingOrder === order.id
                              ? 'bg-gray-100 text-gray-400'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                          } rounded-md text-sm font-medium transition-colors`}
                        >
                          <X className="h-4 w-4" />
                          <span>Cancel</span>
                        </button>
                      )}
                      
                      {/* Details Toggle */}
                      <button
                        onClick={() => handleToggleExpand(order.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
                      >
                        <span>Details</span>
                        <ChevronDown 
                          className={`h-4 w-4 transition-transform ${
                            expandedOrder === order.id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Customer Info Summary */}
                <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-4 text-sm">
                  {order.customers ? (
                    <>
                      <div className="flex items-center gap-1 text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{order.customers.name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{order.customers.email || 'No email'}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>Customer information unavailable</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Delivery: {format(new Date(order.delivery_date), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Package className="h-4 w-4" />
                    <span>{order.order_items.length} items</span>
                  </div>
                </div>

                {/* Processing State */}
                {loading === order.id && (
                  <div className="px-4 py-3 bg-blue-50 border-b flex items-center gap-2 text-blue-700">
                    <div className="flex-shrink-0 h-4 w-4 relative">
                      <div className="absolute animate-ping h-4 w-4 rounded-full bg-blue-400 opacity-75"></div>
                      <div className="relative rounded-full h-4 w-4 bg-blue-500"></div>
                    </div>
                    <p className="text-sm font-medium">Processing order...</p>
                  </div>
                )}
                
                {/* Action Result Message */}
                {actionResult && actionResult.orderId === order.id && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`px-4 py-3 border-b flex items-center gap-2 ${
                      actionResult.status === 'success' 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {actionResult.status === 'success' ? (
                      actionResult.action === 'confirmed' ? (
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 flex-shrink-0" />
                      )
                    ) : (
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    )}
                    <p className="text-sm">{actionResult.message}</p>
                  </motion.div>
                )}

                {/* Expanded Order Details */}
                {expandedOrder === order.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 border-t"
                  >
                    <h4 className="font-medium mb-3 text-gray-700">Order Items</h4>
                    <div className="bg-white rounded-lg border overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Item
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {order.order_items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.product?.item_number || 'Unknown'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {item.product?.description || 'Product information not available'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {item.quantity}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {order.notes && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2 text-gray-700">Customer Notes</h4>
                        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm text-gray-700">
                          {order.notes}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
