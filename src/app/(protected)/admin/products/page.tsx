// src/app/(protected)/admin/products/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/utils/adminUtils';
import Link from 'next/link';
import { Plus, Upload, FilePlus, Download } from 'lucide-react';
import ProductsTable from '@/components/admin/ProductsTable';

export default async function AdminProductsPage() {
  const supabase = createServerComponentClient({ cookies });

  // Check if user is admin
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    redirect('/products');
  }

  // Fetch all products
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('item_number');

  if (error) {
    console.error('Error fetching products:', error);
  }

  // Categories removed

  // Total products count
  const totalProducts = products?.length || 0;

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Product Management</h1>
        
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/import"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </Link>
          
          <Link
            href="/admin/products/export"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Link>
          
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>
      
      {/* Simple Stats Overview */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-medium text-gray-700">Total Products</h2>
              <p className="text-3xl font-bold mt-2 text-blue-600">{totalProducts}</p>
            </div>
            <div className="p-2 rounded-full bg-blue-50 border border-blue-100">
              <FilePlus className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Products Table */}
      <ProductsTable initialProducts={products || []} />
    </div>
  );
}