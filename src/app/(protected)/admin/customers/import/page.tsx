// src/app/(protected)/admin/customers/import/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/utils/adminUtils';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CustomerImport from '@/components/admin/CustomerImport';

export default async function CustomerImportPage() {
  const supabase = createServerComponentClient({ cookies });

  // Check if user is admin
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    redirect('/products');
  }

  // Get all available products for selection
  const { data: allProducts, error: allProductsError } = await supabase
    .from('products')
    .select('*')
    .order('item_number');

  if (allProductsError) {
    console.error('Error fetching all products:', allProductsError);
  }

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
          <h1 className="text-3xl font-bold">Bulk Import Customers</h1>
        </div>
      </div>

      <CustomerImport products={allProducts || []} />
    </div>
  );
}