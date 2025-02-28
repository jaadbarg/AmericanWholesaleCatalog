// src/app/(protected)/admin/orders/all/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/utils/adminUtils';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, BarChart3, Download } from 'lucide-react';
import AllOrdersList from '@/components/admin/AllOrdersList';

export default async function AllOrdersPage() {
  const supabase = createServerComponentClient({ cookies });

  // Check if user is admin
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    redirect('/products');
  }

  // Fetch all orders with customer & order items
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
    .order('created_at', { ascending: false })
    .limit(100); // Limit to latest 100 orders for performance

  if (ordersError) {
    console.error('🚨 Error fetching orders:', ordersError);
    return <div>Error loading orders</div>;
  }

  // Get counts for order statuses
  const [pendingCountResult, confirmedCountResult, cancelledCountResult, totalCountResult] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'pending'),
    supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'confirmed'),
    supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'cancelled'),
    supabase.from('orders').select('id', { count: 'exact' })
  ]);

  const pendingCount = pendingCountResult.count || 0;
  const confirmedCount = confirmedCountResult.count || 0;
  const cancelledCount = cancelledCountResult.count || 0;
  const totalCount = totalCountResult.count || 0;

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
    
    console.log('Customer data for order:', order.id, customerData);
    
    return {
      ...restOrder,
      customers: customerData,
      order_items: order.order_items.map((item) => ({
        ...item,
        product: productMap.get(item.product_id) || null, // add product details
      })),
    };
  });

  // Get some basic stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
  });

  const thisMonthOrdersCount = thisMonthOrders.length;
  
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
            <span>All Orders</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-blue-500" />
            <span>Order History</span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link 
            href="/admin/orders"
            className="px-4 py-2 bg-gray-100 hover:bg-amber-50 text-gray-800 hover:text-amber-800 rounded-md font-medium flex items-center gap-2"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            Pending ({pendingCount})
          </Link>
          <Link 
            href="/admin/orders/confirmed"
            className="px-4 py-2 bg-gray-100 hover:bg-green-50 text-gray-800 hover:text-green-800 rounded-md font-medium"
          >
            Confirmed ({confirmedCount})
          </Link>
          <Link 
            href="/admin/orders/cancelled"
            className="px-4 py-2 bg-gray-100 hover:bg-red-50 text-gray-800 hover:text-red-800 rounded-md font-medium"
          >
            Cancelled ({cancelledCount})
          </Link>
          <Link 
            href="/admin/orders/all"
            className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md font-medium"
          >
            View All ({totalCount})
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-gray-500 text-sm">Total Orders</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-gray-500 text-sm">Orders This Month</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">{thisMonthOrdersCount}</p>
        </div>
        <div className="bg-white rounded-lg border p-6 flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 text-sm">Export Orders</h3>
            <p className="text-sm text-gray-700 mt-1">Download order data</p>
          </div>
          <Link 
            href="#export-csv" 
            id="dashboard-export-link"
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
            aria-label="Export orders as CSV"
          >
            <Download className="h-5 w-5 text-gray-700" />
          </Link>
        </div>
      </div>

      {ordersWithProductDetails.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <div className="mb-4">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Orders Found</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            There are no orders in the system yet.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <AllOrdersList initialOrders={ordersWithProductDetails} />
        </div>
      )}
    </div>
  );
}