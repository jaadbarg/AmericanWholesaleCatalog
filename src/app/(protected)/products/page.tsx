// src/app/(protected)/products/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ProductsView } from '@/components/products/ProductsView'
import { isAdmin } from '@/lib/utils/adminUtils'

// Helper function to sort products
// function sortProducts(products: any[]) {
//   return products.sort((a, b) => {
//     // Extract the alphabetic prefix and numeric parts
//     const aMatch = a.description.match(/^([A-Za-z]+)(\d+)/)
//     const bMatch = b.description.match(/^([A-Za-z]+)(\d+)/)
    
//     if (!aMatch || !bMatch) {
//       return a.description.localeCompare(b.description)
//     }

//     const [, aPrefix, aNumber] = aMatch
//     const [, bPrefix, bNumber] = bMatch

//     // First compare the alphabetic prefixes
//     if (aPrefix !== bPrefix) {
//       return aPrefix.localeCompare(bPrefix)
//     }

//     // If prefixes are the same, compare the numeric parts
//     return parseInt(aNumber) - parseInt(bNumber)
//   })
// }

export default async function Products() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return <div>Not authenticated</div>
  }

  // Check if user is admin
  if (isAdmin(session.user.email)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-3xl font-bold text-blue-900 mb-4">
          Welcome, Admin Team!
        </h1>
        <p className="text-gray-600 max-w-md mb-8">
          Please use the Admin Panel in the navigation bar to view and manage pending orders.
        </p>
        <div className="p-6 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-800">
            ⚡ Quick Tip: All new orders will appear in your admin panel for review and confirmation.
          </p>
        </div>
      </div>
    )
  }

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

  // Get customer products with notes
  const { data: customerProducts, error: customerProductsError } = await supabase
    .from('customer_products')
    .select('product_id, notes')
    .eq('customer_id', profile.customer_id)

  if (customerProductsError) {
    return <div>Error loading customer products: {customerProductsError.message}</div>
  }

  // Get products and combine with notes
  const productIds = customerProducts.map(cp => cp.product_id)
  
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)

  if (productsError) {
    return <div>Error loading products: {productsError.message}</div>
  }

  // Combine products with their customer-specific notes
  const productsWithNotes = products.map(product => ({
    ...product,
    customerNote: customerProducts.find(cp => cp.product_id === product.id)?.notes || '',
    customerId: profile.customer_id
  }))

  return (
    <div className="py-8">
      <ProductsView products={productsWithNotes} />
    </div>
  )
}