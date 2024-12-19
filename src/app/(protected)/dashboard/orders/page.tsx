// src/app/(protected)/dashboard/orders/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import OrderDetails from '@/components/orders/OrderDetails'

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
    return <div>No customer profile found.</div>
  }

  // Get orders first
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', profile.customer_id)
    .order('created_at', { ascending: false })

  if (ordersError) {
    console.error('Error fetching orders:', ordersError)
    return <div>Error loading orders</div>
  }

  // Then get order items for each order
  const ordersWithDetails = await Promise.all(
    orders.map(async (order) => {
      // Get order items
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id)

      // Get product details for each order item
      const itemsWithProducts = await Promise.all(
        (orderItems || []).map(async (item) => {
          const { data: product } = await supabase
            .from('products')
            .select('*')
            .eq('id', item.product_id)
            .single()

          return {
            ...item,
            products: product
          }
        })
      )

      return {
        ...order,
        order_items: itemsWithProducts
      }
    })
  )

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-6">Order History</h1>
      
      {ordersWithDetails.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {ordersWithDetails.map((order) => (
            <OrderDetails key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}