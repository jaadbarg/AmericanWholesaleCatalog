// src/app/(protected)/admin/orders/[id]/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/utils/adminUtils';
import Link from 'next/link';
import { ArrowLeft, FileText, Package, Clock, User, Mail, Phone, Building, Check, X } from 'lucide-react';
import { format } from 'date-fns';
export default async function AdminOrderDetailPage(props: any) {
  const { params } = props;
  // Clean up the ID - it might be URL encoded or have other format issues
  const rawOrderId = params.id;
  const orderId = decodeURIComponent(rawOrderId);
  
  // Log the ID details for debugging
  console.log('Raw Order ID from URL:', rawOrderId);
  console.log('Decoded Order ID:', orderId);
  
  const supabase = createServerComponentClient({ cookies });

  // Check if user is admin
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    redirect('/products');
  }

  console.log('Attempting to fetch order with ID:', orderId);

  // Fetch order with customer & order items
  let orderResult;
  try {
    orderResult = await supabase
      .from('orders')
      .select(`
        id,
        customer_id,
        status,
        created_at,
        updated_at,
        delivery_date,
        notes,
        customer:customer_id (id, name, email, phone, address, company),
        order_items (id, quantity, product_id)
      `)
      .eq('id', orderId)
      .single();
    
    console.log('Query result:', JSON.stringify(orderResult));
  } catch (error) {
    console.error('Exception during order fetch:', error);
  }
  
  const { data: order, error: orderError } = orderResult || { data: null, error: { message: 'Failed to execute query' } };

  if (orderError || !order) {
    console.error('🚨 Error fetching order:', orderError);
    console.error('Order ID being searched:', orderId);
    console.error('Order error message:', orderError?.message);
    return (
      <div className="py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading order details
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Could not find order with ID: {orderId}</p>
                <p className="mt-2">This could be due to:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>The order may have been deleted</li>
                  <li>The order ID may be incorrect</li>
                  <li>There might be a database connection issue</li>
                </ul>
                <div className="mt-4">
                  <Link href="/admin/orders" className="text-red-800 underline font-medium">
                    Return to orders list
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only fetch product details if we have a valid order
  let products: any[] = [];
  let productsError = null;
  
  if (order && order.order_items && order.order_items.length > 0) {
    // Get all product IDs from the order items
    const productIds = order.order_items.map(item => item.product_id).filter(Boolean);

    if (productIds.length > 0) {
      const productResult = await supabase
        .from('products')
        .select('id, item_number, description, category')
        .in('id', productIds);
        
      products = productResult.data || [];
      productsError = productResult.error;
    }
  }

  if (productsError) {
    console.error('🚨 Error fetching products:', productsError);
    // We'll still continue, just without product details
  }

  // Create a product lookup map
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Attach product details to order items (if order items exist)
  const orderItems = order.order_items 
    ? order.order_items.map((item) => ({
        ...item,
        product: item.product_id ? productMap.get(item.product_id) || null : null,
      }))
    : [];

  // Format dates
  const createdDate = new Date(order.created_at);
  const updatedDate = new Date(order.updated_at);
  const deliveryDate = new Date(order.delivery_date);

  // Define status badge styling
  function getStatusBadgeStyle(status: string) {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  return (
    <div className="py-8">
      <div className="flex flex-col space-y-8">
        {/* Header with navigation */}
        <div>
          <Link href="/admin/orders" className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Orders
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Order #{order.id.slice(0, 8)}</h1>
              <p className="text-gray-500 text-sm">
                Created on {format(createdDate, 'MMMM d, yyyy')} at {format(createdDate, 'h:mm a')}
              </p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeStyle(order.status)}`}>
                {order.status === 'pending' && <Clock className="h-4 w-4 mr-1" />}
                {order.status === 'confirmed' && <Check className="h-4 w-4 mr-1" />}
                {order.status === 'cancelled' && <X className="h-4 w-4 mr-1" />}
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left column - Customer & Order Details */}
          <div className="md:col-span-1 space-y-6">
            {/* Customer Details Card */}
            <div className="bg-white rounded-lg border shadow-sm p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-2" />
                Customer Information
              </h2>
              
              {order.customer ? (
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">{order.customer.name || 'N/A'}</p>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <Mail className="h-4 w-4 mr-1" />
                      {order.customer.email || 'No email provided'}
                    </div>
                    {order.customer.phone && (
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Phone className="h-4 w-4 mr-1" />
                        {order.customer.phone}
                      </div>
                    )}
                  </div>
                  
                  {order.customer.company && (
                    <div className="flex items-start pt-2">
                      <Building className="h-4 w-4 mr-1 mt-0.5 text-gray-400" />
                      <p className="text-sm text-gray-600">{order.customer.company}</p>
                    </div>
                  )}
                  
                  {order.customer.address && (
                    <div className="pt-2">
                      <p className="text-sm text-gray-700 whitespace-pre-line">{order.customer.address}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 text-amber-700 p-3 rounded-md text-sm">
                  Customer information is unavailable
                </div>
              )}
            </div>
            
            {/* Order Details Card */}
            <div className="bg-white rounded-lg border shadow-sm p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                Order Details
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Order ID</span>
                  <span className="font-medium">{order.id}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Created</span>
                  <span>{format(createdDate, 'MMM d, yyyy h:mm a')}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Last Updated</span>
                  <span>{format(updatedDate, 'MMM d, yyyy h:mm a')}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Delivery Date</span>
                  <span className="font-medium">{format(deliveryDate, 'MMMM d, yyyy')}</span>
                </div>
                
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Items Total</span>
                  <span className="font-medium">{orderItems.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Line Items */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="border-b p-5">
                <h2 className="text-lg font-semibold flex items-center">
                  <Package className="h-5 w-5 text-gray-400 mr-2" />
                  Order Items
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Item Number</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orderItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.product?.item_number || 'Unknown'}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">
                          {item.product?.description || 'Product information not available'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.quantity}
                          </span>
                        </td>
                      </tr>
                    ))}
                    
                    {orderItems.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-5 py-8 text-center text-gray-500">
                          No items in this order
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Notes Section */}
              {order.notes && (
                <div className="p-5 border-t">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-1 text-gray-400" />
                    Order Notes
                  </h3>
                  <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-700 whitespace-pre-line">
                    {order.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}