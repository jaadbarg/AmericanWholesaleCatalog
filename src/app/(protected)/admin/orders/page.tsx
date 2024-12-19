// src/app/(protected)/admin/orders/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/utils/adminUtils'

export default async function AdminOrdersPage() {
  const supabase = createServerComponentClient({ cookies })
  
  // Check authentication and admin status
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    redirect('/products')
  }

  // Get all pending orders with customer and item details
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      created_at,
      delivery_date,
      status,
      notes,
      customers (
        name,
        email
      ),
      order_items (
        quantity,
        products (
          item_number,
          description
        )
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    return <div>Error loading orders</div>
  }

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Order Management</h1>
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No pending orders to review</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium">Order #{order.id.slice(0, 8)}</h3>
                  <p className="text-sm text-gray-500">
                    {order.customers?.name} ({order.customers?.email})
                  </p>
                  <p className="text-sm text-gray-500">
                    Delivery: {new Date(order.delivery_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-x-2">
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                    Approve
                  </button>
                  <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                    Deny
                  </button>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Order Items:</h4>
                <ul className="space-y-2">
                  {order.order_items.map((item, index) => (
                    <li key={index} className="text-sm">
                      {item.quantity}x {item.products.item_number} - {item.products.description}
                    </li>
                  ))}
                </ul>
                {order.notes && (
                  <div className="mt-4">
                    <h4 className="font-medium">Notes:</h4>
                    <p className="text-sm text-gray-600">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}