// src/components/orders/EnhancedOrderDetails.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Package, Calendar, FileText, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow, format } from 'date-fns'

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

export function EnhancedOrderDetails({ order }: { order: Order }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (e) {
        console.log(e)
      return dateString;
    }
  };

  const getStatusDetails = (status: string): { color: string; label: string; description: string } => {
    switch (status.toLowerCase()) {
      case 'pending':
        return { 
          color: 'warning', 
          label: 'Pending Approval',
          description: 'Your order is being reviewed by our team.'
        };
      case 'confirmed':
        return { 
          color: 'primary', 
          label: 'Confirmed',
          description: 'Your order has been confirmed and is being prepared for delivery.'
        };
      case 'delivered':
        return { 
          color: 'success', 
          label: 'Delivered',
          description: 'Your order has been delivered successfully.'
        };
      case 'cancelled':
        return { 
          color: 'danger', 
          label: 'Cancelled',
          description: 'This order has been cancelled.'
        };
      default:
        return { 
          color: 'default', 
          label: status.charAt(0).toUpperCase() + status.slice(1),
          description: 'Order status information'
        };
    }
  };

  const statusDetails = getStatusDetails(order.status);
  const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: true });

  return (
    <Card
      className={`overflow-hidden ${order.status === 'cancelled' ? 'opacity-75' : ''}`}
    >
      <CardHeader className="p-0">
        <div 
          className={`px-6 py-4 border-l-4 ${
            statusDetails.color === 'primary' ? 'border-blue-500 bg-blue-50' : 
            statusDetails.color === 'warning' ? 'border-amber-500 bg-amber-50' : 
            statusDetails.color === 'success' ? 'border-green-500 bg-green-50' : 
            statusDetails.color === 'danger' ? 'border-red-500 bg-red-50' : 
            'border-gray-500 bg-gray-50'
          } cursor-pointer`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start space-x-3">
              <Package className={`h-5 w-5 mt-0.5 ${
                statusDetails.color === 'primary' ? 'text-blue-600' : 
                statusDetails.color === 'warning' ? 'text-amber-600' : 
                statusDetails.color === 'success' ? 'text-green-600' : 
                statusDetails.color === 'danger' ? 'text-red-600' : 
                'text-gray-600'
              }`} />
              
              <div>
                <div className="flex items-center">
                  <h3 className="font-medium text-gray-900">
                    Order #{order.id.slice(0, 8)}...
                  </h3>
                  <Badge 
                    variant={
                      statusDetails.color === 'primary' ? 'primary' : 
                      statusDetails.color === 'warning' ? 'warning' : 
                      statusDetails.color === 'success' ? 'success' : 
                      statusDetails.color === 'danger' ? 'danger' : 
                      'default'
                    }
                    className="ml-2"
                  >
                    {statusDetails.label}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">{statusDetails.description}</p>
              </div>
            </div>
            
            <div className="flex items-center mt-3 sm:mt-0">
              <div className="flex flex-col items-end mr-2">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="mr-1 h-3 w-3" />
                  <span>{timeAgo}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Calendar className="mr-1 h-3 w-3" />
                  <span>Delivery: {formatDate(order.delivery_date)}</span>
                </div>
              </div>

              <ChevronDown
                className={`h-5 w-5 text-gray-400 transform transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Order Items */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items</h4>
                  <div className="bg-gray-50 rounded-lg overflow-hidden border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item Number
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {order.order_items.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                              {item.products.item_number}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {item.products.description}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">
                              {item.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={2} className="px-4 py-3 text-sm font-medium text-gray-700 text-right">
                            Total Items:
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                            {order.order_items.reduce((acc, item) => acc + item.quantity, 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Order Notes (if any) */}
                {order.notes && (
                  <div>
                    <h4 className="flex items-center text-sm font-medium text-gray-900 mb-2">
                      <FileText className="h-4 w-4 mr-1 text-gray-400" />
                      Order Notes
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-700">
                      {order.notes}
                    </div>
                  </div>
                )}

                {/* Reorder Button (only for completed orders) */}
                {(order.status === 'delivered' || order.status === 'confirmed') && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Reorder functionality would go here
                        alert('Reorder functionality would be implemented here');
                      }}
                    >
                      Reorder These Items
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}