// src/components/orders/EnhancedOrderDetails.tsx
'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Package, Calendar, FileText, Clock, Printer, RepeatIcon, ShoppingCart, CheckCircle, XCircle, HelpCircle, AlertCircle } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useRouter } from 'next/navigation'
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
  const printRef = useRef<HTMLDivElement>(null)
  const addItem = useCart((state) => state.addItem)
  const router = useRouter()

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (e) {
        console.log(e)
      return dateString;
    }
  };

  const getStatusDetails = (status: string): { color: string; label: string; description: string; icon: React.ReactNode } => {
    switch (status.toLowerCase()) {
      case 'pending':
        return { 
          color: 'warning', 
          label: 'Pending Approval',
          description: 'Your order is being reviewed by our team.',
          icon: <AlertCircle className="h-5 w-5" />
        };
      case 'confirmed':
        return { 
          color: 'primary', 
          label: 'Confirmed',
          description: 'Your order has been confirmed and is being prepared for delivery.',
          icon: <CheckCircle className="h-5 w-5" />
        };
      case 'delivered':
        return { 
          color: 'success', 
          label: 'Delivered',
          description: 'Your order has been delivered successfully.',
          icon: <CheckCircle className="h-5 w-5" />
        };
      case 'cancelled':
        return { 
          color: 'danger', 
          label: 'Cancelled',
          description: 'This order has been cancelled.',
          icon: <XCircle className="h-5 w-5" />
        };
      default:
        return { 
          color: 'default', 
          label: status.charAt(0).toUpperCase() + status.slice(1),
          description: 'Order status information',
          icon: <HelpCircle className="h-5 w-5" />
        };
    }
  };

  const statusDetails = getStatusDetails(order.status);
  const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: true });

  return (
    <Card
      className={`overflow-hidden border-2 ${order.status === 'cancelled' ? 'opacity-75 border-gray-200' : 'border-american-navy-200'}`}
    >
      <CardHeader className="p-0">
        <div 
          className={`px-6 py-4 border-l-4 ${
            statusDetails.color === 'primary' ? 'border-american-navy-500 bg-american-navy-50' : 
            statusDetails.color === 'warning' ? 'border-amber-500 bg-amber-50' : 
            statusDetails.color === 'success' ? 'border-green-500 bg-green-50' : 
            statusDetails.color === 'danger' ? 'border-american-red-500 bg-red-50' : 
            'border-gray-500 bg-gray-50'
          } cursor-pointer relative`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Click instruction for less tech-savvy users */}
          <div className="absolute right-2 top-2 text-xs text-american-navy-600 flex items-center bg-american-navy-100 px-2 py-1 rounded-full">
            <span className="mr-1">Click for details</span>
            <ChevronDown
              className={`h-3 w-3 transform transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex items-start space-x-3">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                statusDetails.color === 'primary' ? 'bg-american-navy-100 text-american-navy-600' : 
                statusDetails.color === 'warning' ? 'bg-amber-100 text-amber-600' : 
                statusDetails.color === 'success' ? 'bg-green-100 text-green-600' : 
                statusDetails.color === 'danger' ? 'bg-red-50 text-american-red-600' : 
                'bg-gray-100 text-gray-600'
              }`}>
                {statusDetails.icon}
              </div>
              
              <div>
                <div className="flex items-center">
                  <h3 className="text-lg font-bold text-american-navy-800">
                    Order #{order.id.slice(0, 6)}
                  </h3>
                  <Badge 
                    variant={
                      statusDetails.color === 'primary' ? 'primary' : 
                      statusDetails.color === 'warning' ? 'warning' : 
                      statusDetails.color === 'success' ? 'success' : 
                      statusDetails.color === 'danger' ? 'danger' : 
                      'default'
                    }
                    size="lg"
                    className="ml-2"
                  >
                    {statusDetails.label}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 mt-1 font-medium">{statusDetails.description}</p>
                
                <div className="flex flex-wrap mt-3 gap-3">
                  <div className="flex items-center text-sm bg-gray-100 px-3 py-1 rounded-full">
                    <Clock className="mr-2 h-4 w-4 text-american-navy-600" />
                    <span className="font-medium">Order placed: {timeAgo}</span>
                  </div>
                  <div className="flex items-center text-sm bg-gray-100 px-3 py-1 rounded-full">
                    <Calendar className="mr-2 h-4 w-4 text-american-navy-600" />
                    <span className="font-medium">Delivery: {formatDate(order.delivery_date)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2">
            {!isExpanded && (
              <div className="text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-1">
                {order.order_items.length} {order.order_items.length === 1 ? 'item' : 'items'} ordered
              </div>
            )}
            {!isExpanded && order.notes && (
              <div className="text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-1 flex items-center">
                <FileText className="mr-1 h-3 w-3" />
                Notes attached
              </div>
            )}
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
                {/* Action buttons at the top for easier access */}
                <div className="flex flex-wrap gap-3 pb-4 border-b border-gray-200">
                  {/* Print Order Button - Always visible */}
                  <Button
                    variant="outline"
                    size="md"
                    className="flex items-center text-american-navy-700 border-american-navy-300 hover:bg-american-navy-50"
                    onClick={() => {
                      // Create a printable version with only the order items
                      const printContent = document.createElement('div');
                      if (printRef.current) {
                        printContent.innerHTML = `
                          <html>
                            <head>
                              <title>Order #${order.id.slice(0, 8)} - American Wholesalers</title>
                              <style>
                                body { font-family: Arial, sans-serif; padding: 20px; }
                                h1 { color: #102A43; margin-bottom: 5px; }
                                .header { border-bottom: 2px solid #102A43; padding-bottom: 10px; margin-bottom: 20px; }
                                .status { display: inline-block; padding: 5px 10px; border-radius: 15px; margin-left: 10px; font-size: 14px; }
                                .primary { background-color: #D9E2EC; color: #243B53; }
                                .success { background-color: #d1fae5; color: #065f46; }
                                .warning { background-color: #fef3c7; color: #92400e; }
                                .danger { background-color: #fee2e2; color: #b91c1c; }
                                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                                th { background-color: #F0F4F8; padding: 10px; text-align: left; border-bottom: 1px solid #9FB3C8; }
                                td { padding: 10px; border-bottom: 1px solid #D9E2EC; }
                                .date-box { margin-top: 20px; padding: 10px; background-color: #F0F4F8; border-radius: 5px; display: inline-block; }
                                .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #D9E2EC; font-size: 12px; text-align: center; color: #486581; }
                              </style>
                            </head>
                            <body>
                              <div class="header">
                                <h1>Order #${order.id.slice(0, 8)}</h1>
                                <p>Status: <span class="status ${statusDetails.color}">${statusDetails.label}</span></p>
                                <p>Order Date: ${format(new Date(order.created_at), 'MMMM d, yyyy')}</p>
                              </div>
                              
                              ${printRef.current.outerHTML}
                              
                              <div class="date-box">
                                <strong>Delivery Date:</strong> ${formatDate(order.delivery_date)}
                              </div>
                              
                              ${order.notes ? `
                                <div style="margin-top: 20px; padding: 10px; border: 1px solid #D9E2EC; border-radius: 5px;">
                                  <strong>Order Notes:</strong><br>
                                  ${order.notes}
                                </div>
                              ` : ''}
                              
                              <div class="footer">
                                <p>Thank you for your business!</p>
                                <p>American Wholesalers - Printed on ${format(new Date(), 'MMMM d, yyyy')}</p>
                              </div>
                            </body>
                          </html>
                        `;
                        
                        const printWindow = window.open('', '_blank', 'width=800,height=600');
                        if (printWindow) {
                          printWindow.document.write(printContent.innerHTML);
                          printWindow.document.close();
                          printWindow.focus();
                          setTimeout(() => {
                            printWindow.print();
                            printWindow.close();
                          }, 500);
                        }
                      }
                    }}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Order
                  </Button>
                  
                  {/* Reorder Button - only for completed orders */}
                  {(order.status === 'delivered' || order.status === 'confirmed') && (
                    <Button
                      variant="primary"
                      size="md"
                      className="flex items-center"
                      onClick={() => {
                        // Add all items from this order to cart
                        order.order_items.forEach(item => {
                          addItem({
                            id: item.products.id,
                            item_number: item.products.item_number,
                            description: item.products.description,
                            quantity: item.quantity
                          });
                        });
                        
                        // Navigate to cart
                        router.push('/cart');
                      }}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Order Again
                    </Button>
                  )}
                </div>

                {/* Order Items - Enhanced for readability */}
                <div ref={printRef}>
                  <h4 className="text-lg font-bold text-american-navy-800 mb-3 flex items-center">
                    <Package className="mr-2 h-5 w-5 text-american-navy-600" />
                    Your Ordered Items
                  </h4>
                  <div className="bg-white rounded-xl overflow-hidden border-2 border-american-navy-100 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-american-navy-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-sm font-bold text-american-navy-800">
                            Item Number
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-sm font-bold text-american-navy-800">
                            Description
                          </th>
                          <th scope="col" className="px-4 py-3 text-center text-sm font-bold text-american-navy-800">
                            Quantity
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {order.order_items.map((item) => (
                          <tr key={item.id} className="hover:bg-american-navy-50">
                            <td className="px-4 py-4 whitespace-nowrap text-base font-medium text-american-navy-700">
                              {item.products.item_number}
                            </td>
                            <td className="px-4 py-4 text-base text-gray-800">
                              {item.products.description}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-base font-medium text-american-navy-800 text-center bg-american-navy-50">
                              <span className="inline-block px-4 py-1 rounded-full bg-white border border-american-navy-200">
                                {item.quantity}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-american-navy-100">
                        <tr>
                          <td colSpan={2} className="px-4 py-3 text-base font-bold text-american-navy-800 text-right">
                            Total Items:
                          </td>
                          <td className="px-4 py-3 text-base font-bold text-american-navy-900 text-center">
                            {order.order_items.reduce((acc, item) => acc + item.quantity, 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Order Notes (if any) */}
                {order.notes && (
                  <div className="bg-white p-5 rounded-xl border-2 border-american-navy-100">
                    <h4 className="flex items-center text-lg font-bold text-american-navy-800 mb-3">
                      <FileText className="h-5 w-5 mr-2 text-american-navy-600" />
                      Special Instructions
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg text-base text-gray-700 border border-gray-200">
                      {order.notes}
                    </div>
                  </div>
                )}

                {/* Delivery Information */}
                <div className="flex justify-center mt-6">
                  <div className="bg-american-navy-50 text-american-navy-800 rounded-xl p-4 inline-flex items-center">
                    <div className="mr-3 text-american-navy-600">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium">Delivery Date:</p>
                      <p className="text-xl font-bold">{formatDate(order.delivery_date)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}