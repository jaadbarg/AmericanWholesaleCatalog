// src/app/(protected)/admin/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/utils/adminUtils';
import Link from 'next/link';
import { BarChart3, PackageOpen, Users, Truck, Clock, UserPlus, Upload, FilePlus, Layers } from 'lucide-react';

export default async function AdminDashboardPage() {
  const supabase = createServerComponentClient({ cookies });

  // Check if user is admin
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    redirect('/products');
  }

  // Fetch statistics
  const [
    pendingOrdersResult,
    totalOrdersResult,
    totalCustomersResult,
    totalProductsResult,
    recentOrdersResult
  ] = await Promise.all([
    // Pending orders count
    supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'pending'),
    // Total orders count
    supabase.from('orders').select('id', { count: 'exact' }),
    // Total customers count
    supabase.from('customers').select('id', { count: 'exact' }),
    // Total products count
    supabase.from('products').select('id', { count: 'exact' }),
    // Recent orders (last 5)
    supabase
      .from('orders')
      .select(`
        id,
        customer_id,
        status,
        created_at,
        delivery_date,
        customer:customers(name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(5)
  ]);

  const pendingOrdersCount = pendingOrdersResult.count || 0;
  const totalOrdersCount = totalOrdersResult.count || 0;
  const totalCustomersCount = totalCustomersResult.count || 0;
  const totalProductsCount = totalProductsResult.count || 0;
  const recentOrders = recentOrdersResult.data || [];

  const dashboardCards = [
    {
      title: 'Pending Orders',
      value: pendingOrdersCount,
      icon: <Clock className="h-6 w-6 text-amber-500" />,
      href: '/admin/orders',
      color: 'bg-amber-50 border-amber-200',
      textColor: 'text-amber-600'
    },
    {
      title: 'Total Orders',
      value: totalOrdersCount,
      icon: <PackageOpen className="h-6 w-6 text-blue-500" />,
      href: '/admin/orders/all',
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-600'
    },
    {
      title: 'Customers',
      value: totalCustomersCount,
      icon: <Users className="h-6 w-6 text-green-500" />,
      href: '/admin/customers',
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-600'
    },
    {
      title: 'Products',
      value: totalProductsCount,
      icon: <Truck className="h-6 w-6 text-purple-500" />,
      href: '/admin/products',
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-600'
    },
  ];

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardCards.map((card, index) => (
          <Link 
            key={index}
            href={card.href}
            className={`block p-6 rounded-lg border ${card.color} hover:shadow-md transition-shadow`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-medium text-gray-700">{card.title}</h2>
                <p className={`text-3xl font-bold mt-2 ${card.textColor}`}>{card.value}</p>
              </div>
              <div className="p-2 rounded-full bg-white shadow-sm">
                {card.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
          <Link 
            href="/admin/orders"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View all
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="py-3 px-2 text-left font-medium text-gray-500 text-sm">ORDER #</th>
                <th className="py-3 px-2 text-left font-medium text-gray-500 text-sm">CUSTOMER</th>
                <th className="py-3 px-2 text-left font-medium text-gray-500 text-sm">STATUS</th>
                <th className="py-3 px-2 text-left font-medium text-gray-500 text-sm">DATE</th>
                <th className="py-3 px-2 text-left font-medium text-gray-500 text-sm">DELIVERY</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-2">
                    <Link 
                      href={`/admin/orders/${encodeURIComponent(order.id)}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      #{order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="py-3 px-2">
                    {order.customer?.name || 'Unknown'}
                  </td>
                  <td className="py-3 px-2">
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
                  <td className="py-3 px-2 text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-500">
                    {new Date(order.delivery_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    No recent orders
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Orders Management</h2>
          <div className="space-y-3">
            <Link 
              href="/admin/orders"
              className="flex items-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
            >
              <PackageOpen className="h-4 w-4 mr-2" />
              Pending Orders
            </Link>
            <Link 
              href="/admin/orders/all"
              className="flex items-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              All Orders
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Customer Management</h2>
          <div className="space-y-3">
            <Link 
              href="/admin/customers"
              className="flex items-center px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-md transition-colors"
            >
              <Users className="h-4 w-4 mr-2" />
              View All Customers
            </Link>
            <Link 
              href="/admin/customers/new"
              className="flex items-center px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-md transition-colors"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add New Customer
            </Link>
            <Link 
              href="/admin/customers/import"
              className="flex items-center px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-md transition-colors"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Customers
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Product Management</h2>
          <div className="space-y-3">
            <Link 
              href="/admin/products"
              className="flex items-center px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md transition-colors"
            >
              <Truck className="h-4 w-4 mr-2" />
              Manage Products
            </Link>
            <Link 
              href="/admin/products/new"
              className="flex items-center px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md transition-colors"
            >
              <FilePlus className="h-4 w-4 mr-2" />
              Add New Product
            </Link>
            <Link 
              href="/admin/customers/products"
              className="flex items-center px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md transition-colors"
            >
              <Layers className="h-4 w-4 mr-2" />
              Customer Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}