// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export type Profile = {
  id: string
  customer_id: string | null
  created_at: string | null
}

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
  notes: string | null
  created_at: string
}

// Helper function to get the current user's profile and customer data
export async function getCurrentUserData() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      customer:customers(*)
    `)
    .eq('id', session.user.id)
    .single()

  return profile
}

// Helper function to get customer-specific products with notes
export async function getCustomerProducts(customerId: string) {
  const { data, error } = await supabase
    .from('customer_products')
    .select(`
      product_id,
      notes,
      products!inner (
        id,
        item_number,
        description,
        category,
        created_at,
        updated_at
      )
    `)
    .eq('customer_id', customerId)

  if (error) throw error
  return data?.map(item => ({
    ...item.products,
    notes: item.notes
  })) || []
}

// Helper function to update product notes
export async function updateProductNotes(customerId: string, productId: string, notes: string) {
  if (!customerId || !productId) {
    console.error('Error: customerId and productId are required.')
    return null
  }

  const { error } = await supabase
    .from('customer_products')
    .update({ notes })
    .eq('customer_id', customerId)
    .eq('product_id', productId)

  if (error) {
    console.error('Error updating product notes:', error)
    return null
  }

  return { success: true }
}

// Helper function to get all customers
export async function getAllCustomers() {
  const { data, error } = await supabase
    .from('customer')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching customers:', error)
    return []
  }

  return data
}

// Helper function to get all products
export async function getAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('item_number')

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data
}

// Helper function to get customer's assigned products
export async function getCustomerProductIds(customerId: string) {
  const { data, error } = await supabase
    .from('customer_products')
    .select('product_id')
    .eq('customer_id', customerId)

  if (error) {
    console.error('Error fetching customer products:', error)
    return []
  }

  return data.map(item => item.product_id)
}

// Helper function to add products to a customer
export async function addProductsToCustomer(customerId: string, productIds: string[]) {
  if (!customerId || !productIds.length) {
    console.error('Error: customerId and productIds are required.')
    return { success: false, message: 'Missing required parameters' }
  }

  // Format data for insertion
  const customerProducts = productIds.map(productId => ({
    customer_id: customerId,
    product_id: productId,
    created_at: new Date().toISOString()
  }))

  const { error } = await supabase
    .from('customer_products')
    .upsert(customerProducts, { onConflict: 'customer_id,product_id' })

  if (error) {
    console.error('Error adding products to customer:', error)
    return { success: false, message: error.message }
  }

  return { success: true }
}

// Helper function to remove products from a customer
export async function removeProductsFromCustomer(customerId: string, productIds: string[]) {
  if (!customerId || !productIds.length) {
    console.error('Error: customerId and productIds are required.')
    return { success: false, message: 'Missing required parameters' }
  }

  const { error } = await supabase
    .from('customer_products')
    .delete()
    .eq('customer_id', customerId)
    .in('product_id', productIds)

  if (error) {
    console.error('Error removing products from customer:', error)
    return { success: false, message: error.message }
  }

  return { success: true }
}

// Helper function to create a new customer with products
export async function createCustomerWithProducts(
  customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>, 
  productIds: string[]
) {
  // Create the customer
  const { data: customer, error: customerError } = await supabase
    .from('customer')
    .insert({
      ...customerData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (customerError) {
    console.error('Error creating customer:', customerError)
    return { success: false, message: customerError.message }
  }

  // If there are products to add, add them
  if (productIds.length > 0) {
    const result = await addProductsToCustomer(customer.id, productIds)
    if (!result.success) {
      return result
    }
  }

  return { success: true, customer }
}

// Helper function to create an order
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
      notes: notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (orderError) throw orderError

  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    created_at: new Date().toISOString()
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    // Rollback order if items insertion fails
    await supabase
      .from('orders')
      .delete()
      .eq('id', order.id)
    throw itemsError
  }

  return order
}

// Helper function to get orders with details
export async function getOrderWithDetails(orderId: string) {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        quantity,
        products (
          id,
          item_number,
          description
        )
      )
    `)
    .eq('id', orderId)
    .single()

  if (orderError) throw orderError
  return order
}