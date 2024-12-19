// src/app/(protected)/products/page.tsx
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

export default async function Products() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .limit(10)

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products?.map((product) => (
          <div 
            key={product.id} 
            className="p-6 bg-white rounded-lg shadow"
          >
            <h3 className="font-semibold">{product.item_number}</h3>
            <p className="text-gray-600">{product.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}