// src/app/(protected)/admin/customers/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/utils/adminUtils';
import Link from 'next/link';
import { UserPlus, Search, PlusCircle, Upload } from 'lucide-react';
import { Customer } from '@/lib/supabase/client';

export default async function AdminCustomersPage() {
  const supabase = createServerComponentClient({ cookies });

  // Check if user is admin
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    redirect('/products');
  }

  // Fetch customers
  const { data: customers, error } = await supabase
    .from('customer')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching customers:', error);
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Customer Management</h1>
        <div className="flex gap-3">
          <Link
            href="/admin/customers/import"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Import Customers</span>
          </Link>
          <Link
            href="/admin/customers/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>New Customer</span>
          </Link>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-lg border shadow-sm p-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search customers..."
          />
        </div>
      </div>

      {/* Customers list */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">NAME</th>
                <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">EMAIL</th>
                <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">JOINED</th>
                <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">PRODUCTS</th>
                <th className="py-3 px-4 text-right font-medium text-gray-500 text-sm">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {customers && customers.map((customer: Customer) => (
                <tr key={customer.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <Link
                      href={`/admin/customers/${encodeURIComponent(customer.id)}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {customer.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {customer.email}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-sm">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/admin/customers/${encodeURIComponent(customer.id)}/products`}
                      className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    >
                      <PlusCircle className="h-3 w-3 mr-1" />
                      Manage Products
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <Link
                        href={`/admin/customers/${encodeURIComponent(customer.id)}/edit`}
                        className="text-gray-500 hover:text-gray-700 font-medium text-sm"
                      >
                        Edit
                      </Link>
                      <span className="text-gray-300">|</span>
                      <button
                        className="text-red-500 hover:text-red-700 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {(!customers || customers.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    No customers found
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