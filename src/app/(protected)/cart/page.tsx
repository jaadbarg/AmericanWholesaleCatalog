// src/app/(protected)/cart/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { EnhancedCartSummary } from '@/components/cart/EnhancedCartSummary'
import { EnhancedOrderForm } from '@/components/cart/EnhancedOrderForm'
import { useCart } from '@/hooks/useCart'
import { ArrowLeft, ShoppingCart, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

export default function CartPage() {
  const router = useRouter()
  const items = useCart((state) => state.items)
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <div className="max-w-5xl mx-auto py-8">
      {/* Progress bar for visual guidance */}
      <div className="mb-10 px-4">
        <div className="flex justify-between text-sm font-medium mb-2">
          <span className="text-american-navy-700">1. Select Products</span>
          <span className="text-american-navy-900 font-bold">2. Review Cart</span>
          <span className="text-gray-400">3. Order Confirmation</span>
        </div>
        <div className="relative">
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-american-navy-600 rounded-full" style={{ width: '50%' }}></div>
          </div>
          <div className="absolute top-0 left-0 transform -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white bg-american-navy-500"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white bg-american-navy-700 shadow-md"></div>
          <div className="absolute top-0 right-0 transform -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white bg-gray-300"></div>
        </div>
      </div>

      {/* Back button with explanatory text */}
      <div className="flex items-center mb-6">
        <Button 
          onClick={() => router.push('/products')}
          variant="outline"
          size="sm"
          className="mr-3 text-american-navy-700"
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to Catalog
        </Button>
        <span className="text-sm text-gray-500">Need to add more items? You can return to the catalog.</span>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <ShoppingCart className="h-8 w-8 text-american-navy-900" />
        <div>
          <h1 className="text-3xl font-bold text-american-navy-900">Your Order Cart</h1>
          {items.length > 0 && (
            <p className="text-gray-600 mt-1">Review your items and proceed to place your order</p>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300"
        >
          <ShoppingCart className="h-20 w-20 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-3">Your cart is empty</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Your order cart has no items yet. Browse our catalog to add products to your order.
          </p>
          <Button 
            onClick={() => router.push('/products')}
            size="lg"
            variant="primary"
            className="px-8 py-3 text-lg"
          >
            Browse Product Catalog
          </Button>
        </motion.div>
      ) : (
        <>
          {/* Order summary banner */}
          <div className="bg-american-navy-50 border border-american-navy-100 rounded-lg p-4 mb-8 flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-american-navy-100 rounded-full p-2 mr-3">
                <ShoppingCart className="h-5 w-5 text-american-navy-700" />
              </div>
              <div>
                <h3 className="font-medium text-american-navy-800">Order Summary</h3>
                <p className="text-american-navy-700 text-sm">
                  You have <span className="font-bold">{items.length}</span> {items.length === 1 ? 'product' : 'products'} 
                  {' '}(<span className="font-bold">{totalItems}</span> total units) in your cart
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-american-navy-200 text-american-navy-800 hover:bg-american-navy-100"
              size="sm"
              onClick={() => router.push('/products')}
            >
              Add More Items
            </Button>
          </div>
        
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Larger cart items section */}
            <div className="lg:col-span-2">
              <Card className="border-2 border-gray-200">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2 text-blue-700" />
                    Items in Your Cart
                  </h2>
                  <EnhancedCartSummary />
                </CardContent>
              </Card>
            </div>

            {/* Order details with clear next steps */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <Card className="border-2 border-american-navy-200 shadow-md">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center text-american-navy-800">
                      <Check className="h-5 w-5 mr-2" />
                      Complete Your Order
                    </h2>
                    <EnhancedOrderForm />
                  </CardContent>
                </Card>
                
                <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-medium text-gray-700 mb-2">Need Help?</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    If you have questions about your order, please contact our customer service.
                  </p>
                  <div className="text-sm text-american-navy-700">
                    Phone: (555) 123-4567
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}