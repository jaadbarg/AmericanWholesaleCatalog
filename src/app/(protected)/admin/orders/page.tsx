// src/app/(protected)/admin/orders/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/utils/adminUtils'
import AdminOrderList from '@/components/admin/AdminOrderList'

export default async function AdminOrdersPage() {
  const supabase = createServerComponentClient({ cookies })
  
  // Check if user is admin
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    redirect('/products')
  }

  // Get all pending orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (ordersError) {
    console.error('Error fetching orders:', ordersError)
    return <div>Error loading orders</div>
  }

  // Get customer details and order items for each order
  const ordersWithDetails = await Promise.all(
    orders.map(async (order) => {
      // Get customer info
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', order.customer_id)
        .single()

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
        customers: customer,
        order_items: itemsWithProducts
      }
    })
  )

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Order Management</h1>
      
      {ordersWithDetails.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No pending orders to review</p>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            {ordersWithDetails.length} pending order{ordersWithDetails.length !== 1 ? 's' : ''} to review
          </p>
          <AdminOrderList initialOrders={ordersWithDetails} />
        </div>
      )}
    </div>
  )
}