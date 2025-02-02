// src/app/(protected)/admin/orders/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/utils/adminUtils';
import AdminOrderList from '@/components/admin/AdminOrderList';

export default async function AdminOrdersPage() {
  const supabase = createServerComponentClient({ cookies });

  // Check if user is admin
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    redirect('/products');
  }

  // Fetch all pending orders with customers & order items
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id,
      customer_id,
      status,
      created_at,
      updated_at,
      delivery_date,
      notes,
      customers:customer_id (id, name, email),
      order_items (id, quantity, product_id)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (ordersError) {
    console.error('🚨 Error fetching orders:', ordersError);
    return <div>Error loading orders</div>;
  }

  // Fetch all products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, item_number, description, category');

  if (productsError) {
    console.error('🚨 Error fetching products:', productsError);
    return <div>Error loading products</div>;
  }

  // Create a product lookup map
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Debugging: Log fetched data
  // console.log('✅ All Products:', products);
  // console.log('✅ Product Map:', productMap);

  // Attach product details to order items using product_id
  const ordersWithProductDetails = orders.map((order) => ({
    ...order,
    order_items: order.order_items.map((item) => ({
      ...item,
      product: productMap.get(item.product_id) || null, // Add product details
    })),
  }));

  // Debugging: Log the final order structure
  // console.log('🚀 Final Orders Data:', JSON.stringify(ordersWithProductDetails, null, 2));

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Order Management</h1>
      
      {ordersWithProductDetails.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No pending orders to review</p>
        </div>
      ) : (
        <div className="space-y-6">
          <AdminOrderList initialOrders={ordersWithProductDetails} />
        </div>
      )}
    </div>
  );
}
