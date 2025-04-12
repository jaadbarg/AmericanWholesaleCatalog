// src/app/(protected)/products/ai-mode/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/utils/adminUtils'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import ClientAIOrderAssistant from './ClientAIOrderAssistant'

export default async function AIModePage() {
  const supabase = createServerComponentClient({ cookies })
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/auth/signin')
  }

  // Check if user is admin (redirect admins to admin panel)
  if (isAdmin(session.user.email)) {
    redirect('/admin')
  }

  // Get customer information
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('customer_id')
    .eq('id', session.user.id)
    .single()

  if (profileError || !profile?.customer_id) {
    return <div>Error loading profile or customer ID not found</div>
  }

  // Get customer name
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('name')
    .eq('id', profile.customer_id)
    .single()

  if (customerError) {
    return <div>Error loading customer information</div>
  }

  // Get customer products with notes
  const { data: customerProducts, error: customerProductsError } = await supabase
    .from('customer_products')
    .select('product_id, notes')
    .eq('customer_id', profile.customer_id)

  if (customerProductsError) {
    return <div>Error loading customer products</div>
  }

  const productIds = customerProducts.map(cp => cp.product_id)
  
  // Get product details
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)

  if (productsError) {
    return <div>Error loading products</div>
  }
  
  // Combine products with their customer-specific notes
  const productsWithNotes = products.map(product => ({
    ...product,
    customerNote: customerProducts.find(cp => cp.product_id === product.id)?.notes || ''
  }))

  // Get previous orders (last 5)
  const { data: previousOrders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id,
      created_at,
      delivery_date,
      status,
      order_items (
        id,
        product_id,
        quantity,
        products (
          id,
          item_number,
          description
        )
      )
    `)
    .eq('customer_id', profile.customer_id)
    .order('created_at', { ascending: false })
    .limit(5)

  if (ordersError) {
    console.error('Error fetching previous orders:', ordersError)
    // Continue without previous orders data
  }

  return (
    <div className="py-6 md:py-10">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <Link 
            href="/products" 
            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Products</span>
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-blue-600" />
          AI Order Assistant
        </h1>
        <p className="mt-2 text-gray-600 max-w-2xl">
          Chat with our AI assistant to help you build your order using natural language. 
          Just describe what you need in plain English and the assistant will help you add items to your cart.
        </p>
      </div>
      
      <div className="h-[70vh] bg-white rounded-lg shadow">
        <ClientAIOrderAssistant 
          products={productsWithNotes} 
          customerName={customer.name} 
          previousOrders={previousOrders}
          customerId={profile.customer_id}
        />
      </div>
    </div>
  )
}