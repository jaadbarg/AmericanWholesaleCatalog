// src/app/(protected)/dashboard/orders/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import OrderDetails from '@/components/orders/OrderDetails'

export default async function OrdersPage() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  // Get profile and customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('customer_id')
    .eq('id', session.user.id)
    .single()

  if (!profile?.customer_id) {
    return <div>No customer profile found.</div>
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
    return <div>Error loading orders: {error.message}</div>
  }

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-6">Order History</h1>
      
      {orders && orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => (
            <OrderDetails key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No orders found.</p>
        </div>
      )}
    </div>
  )
}