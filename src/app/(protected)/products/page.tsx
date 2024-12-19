// src/app/(protected)/products/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ProductCard } from '@/components/products/ProductCard'

export default async function Products() {
  const supabase = createServerComponentClient({ cookies })
  
  // Get current session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return <div>Not authenticated</div>
  }

  // Get profile and customer ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('customer_id')
    .eq('id', session.user.id)
    .single()

  if (profileError) {
    return <div>Error loading profile: {profileError.message}</div>
  }

  if (!profile?.customer_id) {
    return <div>No customer ID found for this profile</div>
  }

  // First get the product IDs for this customer
  const { data: customerProducts, error: customerProductsError } = await supabase
    .from('customer_products')
    .select('product_id')
    .eq('customer_id', profile.customer_id)

  if (customerProductsError) {
    return <div>Error loading customer products: {customerProductsError.message}</div>
  }

  // Then get the actual products using the IDs
  const productIds = customerProducts.map(cp => cp.product_id)
  
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)

  if (productsError) {
    return <div>Error loading products: {productsError.message}</div>
  }

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      <div className="mb-4">
        <p className="text-sm text-gray-600">Debug Info:</p>
        <pre className="bg-gray-100 p-2 rounded text-xs">
          {JSON.stringify({
            userId: session.user.id,
            customerId: profile.customer_id,
            productCount: products?.length || 0
          }, null, 2)}
        </pre>
      </div>
      
      {!products || products.length === 0 ? (
        <p className="text-gray-600">No products found for this customer.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard 
              key={product.id}
              product={product}
            />
          ))}
        </div>
      )}
    </div>
  )
}