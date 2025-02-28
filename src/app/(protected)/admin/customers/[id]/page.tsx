// src/app/(protected)/admin/customers/[id]/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/utils/adminUtils';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Package, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ShoppingBag,
  Settings,
  PlusCircle,
  Calendar
} from 'lucide-react';

interface Props {
  params: {
    id: string;
  };
}

export default async function CustomerDetailPage({ params }: Props) {
  const customerId = params.id;
  const supabase = createServerComponentClient({ cookies });

  // Check if user is admin
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    redirect('/products');
  }

  // Fetch customer
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (customerError || !customer) {
    redirect('/admin/customers');
  }

  // Fetch customer's products count
  const { count: productsCount } = await supabase
    .from('customer_products')
    .select('*', { count: 'exact' })
    .eq('customer_id', customerId);

  // Fetch customer's orders
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      created_at,
      delivery_date,
      order_items (
        id,
        quantity
      )
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  // Calculate order statistics
  const totalOrders = orders?.length || 0;
  const pendingOrders = orders?.filter(order => order.status === 'pending').length || 0;
  const confirmedOrders = orders?.filter(order => order.status === 'confirmed').length || 0;
  const cancelledOrders = orders?.filter(order => order.status === 'cancelled').length || 0;
  
  // Calculate total items ordered
  const totalItemsOrdered = orders?.reduce((total, order) => {
    return total + (order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0);
  }, 0) || 0;

  // Format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate joining date
  const joiningDate = formatDate(customer.created_at);

  // Get latest order date
  const latestOrderDate = orders && orders.length > 0 
    ? formatDate(orders[0].created_at)
    : 'No orders';

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/customers"
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <p className="text-gray-500">{customer.email}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/customers/${encodeURIComponent(customerId)}/products`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Manage Products</span>
          </Link>
          <Link
            href={`/admin/customers/${encodeURIComponent(customerId)}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Edit</span>
          </Link>
        </div>
      </div>

      {/* Customer Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-gray-500 text-sm">Total Orders</h3>
              <p className="text-3xl font-bold mt-1">{totalOrders}</p>
            </div>
            <div className="p-2 rounded-full bg-blue-50">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Last order: {latestOrderDate}</p>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-gray-500 text-sm">Items Ordered</h3>
              <p className="text-3xl font-bold mt-1">{totalItemsOrdered}</p>
            </div>
            <div className="p-2 rounded-full bg-purple-50">
              <Package className="h-5 w-5 text-purple-500" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Across all orders</p>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-gray-500 text-sm">Products Access</h3>
              <p className="text-3xl font-bold mt-1">{productsCount || 0}</p>
            </div>
            <div className="p-2 rounded-full bg-green-50">
              <ShoppingBag className="h-5 w-5 text-green-500" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Products in catalog</p>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-gray-500 text-sm">Customer Since</h3>
              <p className="text-3xl font-bold mt-1">{joiningDate}</p>
            </div>
            <div className="p-2 rounded-full bg-amber-50">
              <Calendar className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <p className="text-sm text-gray-500">{formatDate(customer.created_at)}</p>
        </div>
      </div>

      {/* Order Status Overview */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6">Order Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Pending</h3>
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-yellow-700">{pendingOrders}</p>
            <p className="text-sm text-yellow-600 mt-1">Awaiting confirmation</p>
          </div>

          <div className="p-4 rounded-lg bg-green-50 border border-green-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Confirmed</h3>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-700">{confirmedOrders}</p>
            <p className="text-sm text-green-600 mt-1">Ready for delivery</p>
          </div>

          <div className="p-4 rounded-lg bg-red-50 border border-red-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Cancelled</h3>
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-700">{cancelledOrders}</p>
            <p className="text-sm text-red-600 mt-1">Not proceeding</p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
          <Link
            href={`/admin/orders?customer=${encodeURIComponent(customerId)}`}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View all
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">ORDER #</th>
                <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">DATE</th>
                <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">STATUS</th>
                <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">ITEMS</th>
                <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">DELIVERY</th>
                <th className="py-3 px-4 text-right font-medium text-gray-500 text-sm">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {orders && orders.slice(0, 5).map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <Link
                      href={`/admin/orders/${encodeURIComponent(order.id)}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      #{order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-sm">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                      ${order.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : order.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {order.order_items?.length || 0} items
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {order.delivery_date ? formatDate(order.delivery_date) : 'Not scheduled'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/admin/orders/${encodeURIComponent(order.id)}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}

              {(!orders || orders.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500">
                    No orders found for this customer
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}