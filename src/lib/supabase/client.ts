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
  if (!customerId) {
    console.error('Error: customerId is required to fetch customer products.');
    return [];
  }

  const { data, error } = await supabase
    .from('customer_products')
    .select(`
      notes,  -- Fetch user-specific notes
      product:products(
        id,
        item_number,
        description,
        category,
        created_at,
        updated_at
      )
    `)
    .eq('customer_id', customerId);

  if (error) {
    console.error('Error fetching customer products:', error);
    return [];
  }

  if (!data || data.length === 0) {
    console.warn(`No products found for customer with ID: ${customerId}`);
    return [];
  }

  return data.map(item => ({
    ...item.product,
    notes: item.notes // Attach user-specific notes
  }));
}

export async function updateProductNotes(customerId: string, productId: string, notes: string) {
  if (!customerId || !productId) {
    console.error('Error: customerId and productId are required.');
    return null;
  }

  const { error } = await supabase
    .from('customer_products')
    .update({ notes })
    .eq('customer_id', customerId)
    .eq('product_id', productId);

  if (error) {
    console.error('Error updating product notes:', error);
    return null;
  }

  return { success: true };
}

