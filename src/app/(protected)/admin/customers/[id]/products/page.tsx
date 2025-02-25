// src/app/(protected)/admin/customers/[id]/products/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/utils/adminUtils';
import Link from 'next/link';
import { ArrowLeft, Search, Filter, Save } from 'lucide-react';
import { CustomerProductManager } from '@/components/admin/CustomerProductManager';

interface Props {
  params: {
    id: string;
  };
}

export default async function CustomerProductsPage({ params }: Props) {
  const customerId = params.id;
  const supabase = createServerComponentClient({ cookies });

  // Check if user is admin
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    redirect('/products');
  }

  // Fetch customer
  const { data: customer, error: customerError } = await supabase
    .from('customer')
    .select('*')
    .eq('id', customerId)
    .single();

  if (customerError || !customer) {
    redirect('/admin/customers');
  }

  // Fetch customer's current products
  const { data: customerProducts, error: productsError } = await supabase
    .from('customer_products')
    .select('product_id')
    .eq('customer_id', customerId);

  if (productsError) {
    console.error('Error fetching customer products:', productsError);
  }

  // Get all available products
  const { data: allProducts, error: allProductsError } = await supabase
    .from('products')
    .select('*')
    .order('item_number');

  if (allProductsError) {
    console.error('Error fetching all products:', allProductsError);
  }

  // Convert customer products to a set of IDs for easier checking
  const customerProductIds = new Set(
    (customerProducts || []).map(cp => cp.product_id)
  );

  // Pre-process products with selection status
  const products = (allProducts || []).map(product => ({
    ...product,
    selected: customerProductIds.has(product.id)
  }));

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
            <h1 className="text-3xl font-bold">Manage Products</h1>
            <p className="text-gray-500">
              {customer.name} <span className="text-gray-400">({customer.email})</span>
            </p>
          </div>
        </div>
      </div>

      <CustomerProductManager
        customerId={customerId}
        initialProducts={products}
        customerName={customer.name}
      />
    </div>
  );
}