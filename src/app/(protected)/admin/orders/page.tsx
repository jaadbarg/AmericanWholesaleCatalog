// src/app/(protected)/admin/orders/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/utils/adminUtils';
import AdminOrderList from '@/components/admin/AdminOrderList';
import Link from 'next/link';
import { ArrowLeft, Clock, ChevronRight } from 'lucide-react';

export default async function AdminOrdersPage() {
  const supabase = createServerComponentClient({ cookies });

  // Check if user is admin
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    redirect('/products');
  }

  // Fetch all pending orders with customer & order items
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
      customer:customers(id, name, email),
      order_items (id, quantity, product_id)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (ordersError) {
    console.error('🚨 Error fetching orders:', ordersError);
    return <div>Error loading orders</div>;
  }

  // Get counts for order statuses
  const [pendingCountResult, confirmedCountResult, cancelledCountResult] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'pending'),
    supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'confirmed'),
    supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'cancelled')
  ]);

  const pendingCount = pendingCountResult.count || 0;
  const confirmedCount = confirmedCountResult.count || 0;
  const cancelledCount = cancelledCountResult.count || 0;

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

  // Attach product details to order items using product_id
  const ordersWithProductDetails = orders.map((order) => {
    const { customer, ...restOrder } = order; // remove the original 'customer'
    
    // Handle different potential shapes of customer data
    let customerData = null;
    if (customer) {
      if (Array.isArray(customer) && customer.length > 0) {
        customerData = customer[0];
      } else if (typeof customer === 'object') {
        customerData = customer;
      }
    }
    
    return {
      ...restOrder,
      customers: customerData,
      order_items: order.order_items.map((item) => ({
        ...item,
        product: productMap.get(item.product_id) || null, // add product details
      })),
    };
  });

  return (
    <div className="py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Link href="/admin" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>Orders</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Clock className="h-7 w-7 text-amber-500" />
            <span>Pending Orders</span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link 
            href="/admin/orders"
            className="px-4 py-2 bg-amber-100 text-amber-800 rounded-md font-medium flex items-center gap-2"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            Pending ({pendingCount})
          </Link>
          <Link 
            href="/admin/orders/confirmed"
            className="px-4 py-2 bg-gray-100 hover:bg-green-50 text-gray-800 hover:text-green-800 rounded-md font-medium flex items-center gap-2"
          >
            Confirmed ({confirmedCount})
          </Link>
          <Link 
            href="/admin/orders/cancelled"
            className="px-4 py-2 bg-gray-100 hover:bg-red-50 text-gray-800 hover:text-red-800 rounded-md font-medium flex items-center gap-2"
          >
            Cancelled ({cancelledCount})
          </Link>
          <Link 
            href="/admin/orders/all"
            className="px-4 py-2 bg-gray-100 hover:bg-blue-50 text-gray-800 hover:text-blue-800 rounded-md font-medium"
          >
            View All
          </Link>
        </div>
      </div>

      {ordersWithProductDetails.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <div className="mb-4">
            <Clock className="h-12 w-12 text-gray-400 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Pending Orders</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            There are currently no orders waiting for your approval. 
            Check back later or view all orders.
          </p>
          <div className="mt-6">
            <Link 
              href="/admin/orders/all"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              View All Orders
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <AdminOrderList initialOrders={ordersWithProductDetails} />
        </div>
      )}
    </div>
  );
}
