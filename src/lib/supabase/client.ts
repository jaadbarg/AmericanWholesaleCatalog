// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to get the current user's profile and customer data
export async function getCurrentUserData() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    console.log('No session found')
    return null
  }

  console.log('User ID:', session.user.id)

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, customers(*)')
    .eq('id', session.user.id)
    .single()

  if (profileError) {
    console.error('Profile error:', profileError)
    return null
  }

  console.log('Profile data:', profile)
  return profile
}

// Helper function to get customer-specific products
export async function getCustomerProducts(customerId: string) {
  console.log('Fetching products for customer:', customerId)

  const { data: customerProducts, error: customerProductsError } = await supabase
    .from('customer_products')
    .select(`
      product_id,
      products (
        id,
        item_number,
        description,
        category
      )
    `)
    .eq('customer_id', customerId)

  if (customerProductsError) {
    console.error('Customer products error:', customerProductsError)
    return []
  }

  console.log('Customer products data:', customerProducts)
  return customerProducts?.map(item => item.products) || []
}