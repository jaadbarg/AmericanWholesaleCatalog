// src/app/(protected)/dashboard/orders/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { EnhancedOrderDetails } from '@/components/orders/EnhancedOrderDetails'
import { PackageOpen } from 'lucide-react'

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
    <div>
      <div className="flex items-center gap-3 mb-8">
        <PackageOpen className="h-7 w-7 text-blue-900" />
        <h1 className="text-3xl font-bold text-blue-900">Order History</h1>
      </div>
      
      {orders && orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => (
            <EnhancedOrderDetails key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center bg-gray-50 py-16 rounded-lg border border-gray-200">
          <div className="text-gray-400 mb-4">
            <PackageOpen size={48} />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No orders yet</h2>
          <p className="text-gray-500 max-w-md text-center mb-6">
            Your order history will appear here once you place your first order.
          </p>
          <a 
            href="/products" 
            className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
          >
            Browse Products
          </a>
        </div>
      )}
    </div>
  )
}