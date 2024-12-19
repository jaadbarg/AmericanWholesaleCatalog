// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export type Customer = {
  id: string
  name: string
  email: string
  created_at: string
  updated_at: string
}

export type Product = {
  id: string
  item_number: string
  description: string
  category: string | null
  created_at: string
  updated_at: string
}

export type Order = {
  id: string
  customer_id: string
  status: string
  created_at: string
  updated_at: string
  delivery_date: Date | null
  notes: string | null
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  quantity: number
  created_at: string
}

export type CustomerProduct = {
  customer_id: string
  product_id: string
  created_at: string
}

// Helper function to fetch customer-specific products
export async function getCustomerProducts(customerId: string) {
  const { data, error } = await supabase
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

  if (error) throw error
  return data
}

// Helper function to create an order with items
export async function createOrder(
  customerId: string,
  items: { product_id: string; quantity: number }[],
  deliveryDate?: Date,
  notes?: string
) {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: customerId,
      status: 'pending',
      delivery_date: deliveryDate,
      notes: notes
    })
    .select()
    .single()

  if (orderError) throw orderError

  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) throw itemsError

  return order
}