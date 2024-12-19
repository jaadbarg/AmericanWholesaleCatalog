// src/app/(protected)/dashboard/orders/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { format } from 'date-fns'
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

  // First get the orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', profile.customer_id)
    .order('created_at', { ascending: false })

  if (ordersError) {
    return <div>Error loading orders: {ordersError.message}</div>
  }

  // Then for each order, get its items with products
  const ordersWithItems = await Promise.all(
    orders.map(async (order) => {
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          product_id,
          products!inner (
            id,
            item_number,
            description
          )
        `)
        .eq('order_id', order.id)

      if (itemsError) {
        console.error('Error loading items for order:', order.id, itemsError)
        return {
          ...order,
          order_items: []
        }
      }

      return {
        ...order,
        order_items: orderItems
      }
    })
  )

  if (!ordersWithItems.length) {
    return (
      <div className="py-8">
        <h1 className="text-2xl font-bold mb-6">Order History</h1>
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No orders found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-6">Order History</h1>
      <div className="space-y-6">
        {ordersWithItems.map((order) => (
          <OrderDetails key={order.id} order={order} />
        ))}
      </div>
    </div>
  )
}