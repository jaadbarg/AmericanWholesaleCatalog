// src/app/(protected)/dashboard/orders/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { EnhancedOrderDetails } from '@/components/orders/EnhancedOrderDetails'
import { PackageOpen, ShoppingCart } from 'lucide-react'

export default async function OrdersPage() {
  const supabase = createServerComponentClient({ cookies })
  
  // Get current session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  // Get profile and customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('customer_id')
    .eq('id', session.user.id)
    .single()

  if (!profile?.customer_id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-8 max-w-md">
          <div className="text-yellow-500 flex justify-center mb-4">
            <PackageOpen size={48} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Customer Profile Found</h2>
          <p className="text-gray-600">
            We couldn't find a customer profile associated with your account. 
            Please contact support for assistance.
          </p>
        </div>
      </div>
    )
  }

  // Get orders with items
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        quantity,
        products (
          id,
          item_number,
          description
        )
      )
    `)
    .eq('customer_id', profile.customer_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">
        Error loading orders: {error.message}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with enhanced styling */}
      <div className="bg-american-navy-50 p-6 rounded-xl border border-american-navy-200 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-american-navy-100 p-3 rounded-full">
            <PackageOpen className="h-8 w-8 text-american-navy-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-american-navy-800">Your Order History</h1>
            <p className="text-gray-600 mt-1">
              View, print, and reorder from your past orders
            </p>
          </div>
        </div>
      </div>
      
      {/* Simple explanation text for non-technical users */}
      <div className="bg-white p-4 rounded-lg border border-american-navy-100 mb-6 flex items-start">
        <div className="mr-3 text-american-navy-600 flex-shrink-0 mt-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>
        <p className="text-gray-700">
          <span className="font-bold">Click on any order</span> to view its details, print the order, or place the same order again. Need help? Call us at <span className="text-american-navy-700 font-bold">(315) 717-5854</span>
        </p>
      </div>
      
      {orders && orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => (
            <EnhancedOrderDetails key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center bg-white py-16 rounded-xl border-2 border-american-navy-100 shadow-sm">
          <div className="text-american-navy-300 mb-4">
            <PackageOpen size={64} />
          </div>
          <h2 className="text-2xl font-bold text-american-navy-800 mb-2">No Orders Yet</h2>
          <p className="text-gray-600 max-w-md text-center mb-8 text-lg">
            You haven't placed any orders yet. Browse our catalog to find products and place your first order.
          </p>
          <a 
            href="/products" 
            className="px-6 py-3 bg-american-navy-600 text-white rounded-lg hover:bg-american-navy-700 transition-colors text-lg font-medium flex items-center"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Browse Our Products
          </a>
        </div>
      )}
    </div>
  )
}