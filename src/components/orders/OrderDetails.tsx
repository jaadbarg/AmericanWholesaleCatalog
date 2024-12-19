// src/components/orders/OrderDetails.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Package } from 'lucide-react'

type OrderItem = {
  id: string
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
  status: string
  notes: string | null
  order_items: OrderItem[]
}

export default function OrderDetails({ order }: { order: Order }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <motion.div 
      className="bg-white rounded-lg shadow-sm border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div 
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-4">
          <Package className="h-5 w-5 text-gray-400" />
          <div>
            <p className="font-medium">
              Order #{order.id.slice(0, 8)}...
            </p>
            <p className="text-sm text-gray-500">
              Placed on {new Date(order.created_at).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-500">
              Delivery: {new Date(order.delivery_date).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0 }}
        className="overflow-hidden"
      >
        <div className="p-4 border-t">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Items</h3>
              <ul className="mt-2 divide-y divide-gray-200">
                {order.order_items.map((item) => (
                  <li key={item.id} className="py-2">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.products.item_number}</p>
                        <p className="text-sm text-gray-500">{item.products.description}</p>
                      </div>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {order.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-900">Notes</h3>
                <p className="text-sm text-gray-500">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}