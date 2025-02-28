// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Regular client for user operations - safe for client-side
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

// Admin client for admin operations - ONLY for server-side use
// This will be null on the client side for safety
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
export const adminSupabase = typeof window === 'undefined' && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Utility function to generate random password
function generateRandomPassword(): string {
  return crypto.randomUUID() + crypto.randomUUID(); // Generates a sufficiently long random string
}

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
    .from('customers')
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

  try {
    console.log("addProductsToCustomer - calling admin_assign_products with customerId:", customerId);
    console.log("addProductsToCustomer - productIds:", productIds);
    
    // Use RPC function to assign products (bypasses RLS)
    const { error, data } = await supabase.rpc('admin_assign_products', {
      customer_id_param: customerId,
      product_ids_param: productIds
    })
    
    console.log("addProductsToCustomer - response data:", data);
    console.log("addProductsToCustomer - error:", error);

    if (error) {
      console.error('Error adding products to customer via RPC:', error)
      return { success: false, message: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in addProductsToCustomer:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

// Helper function to remove products from a customer
export async function removeProductsFromCustomer(customerId: string, productIds: string[]) {
  if (!customerId || !productIds.length) {
    console.error('Error: customerId and productIds are required.')
    return { success: false, message: 'Missing required parameters' }
  }

  try {
    console.log("removeProductsFromCustomer - calling admin_remove_products with customerId:", customerId);
    console.log("removeProductsFromCustomer - productIds:", productIds);
    
    // Use admin RPC function to remove products
    const { error, data } = await supabase.rpc('admin_remove_products', {
      customer_id_param: customerId,
      product_ids_param: productIds
    })
    
    console.log("removeProductsFromCustomer - response data:", data);
    console.log("removeProductsFromCustomer - error:", error);

    if (error) {
      console.error('Error removing products from customer via admin RPC:', error)
      return { success: false, message: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in removeProductsFromCustomer:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

// Helper function to generate a more secure random password
function generateSecurePassword(): string {
  // Create a strong password with mixed characters
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specials = '!@#$%^&*()_+{}|:<>?';
  
  let password = '';
  
  // Add at least one of each character type
  password += letters.charAt(Math.floor(Math.random() * letters.length));
  password += letters.toLowerCase().charAt(Math.floor(Math.random() * letters.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += specials.charAt(Math.floor(Math.random() * specials.length));
  
  // Add more random characters to reach desired length
  for (let i = 0; i < 8; i++) {
    const allChars = letters + numbers + specials;
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

// Helper function to create a new customer with products
// NOTE: This function will NOT work on the client side as it requires admin privileges
// It should only be called from server-side code (API routes, Server Actions, etc.)
export async function createCustomerWithProducts(
  customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>,
  productIds: string[] = []
) {
  try {
    // Check if we have access to the admin client (server-side only)
    if (!adminSupabase) {
      console.error('Admin operations can only be performed server-side');
      return { 
        success: false, 
        message: 'This function can only be called from server-side code. Use the API route instead.' 
      };
    }

    // Step 1: Create the auth user first (mandatory)
    console.log("Step 1: Creating auth user with email:", customerData.email);
    const tempPassword = 'Welcome123!'; // Fixed password for now
    
    const { data: userData, error: createUserError } = await adminSupabase.auth.admin.createUser({
      email: customerData.email,
      password: tempPassword,
      user_metadata: { name: customerData.name },
      email_confirm: true // Auto-confirm email
    });

    if (createUserError || !userData || !userData.user) {
      console.error('Failed to create auth user:', createUserError?.message);
      return { 
        success: false, 
        message: createUserError?.message || 'Failed to create auth user' 
      };
    }

    const userId = userData.user.id;
    console.log("Auth user created successfully with ID:", userId);

    // Step 2: Create the customer record using the auth user ID
    console.log("Step 2: Creating customer record with auth user ID");
    const customer = {
      id: userId, // Use auth user ID for customer ID
      name: customerData.name,
      email: customerData.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: insertError } = await adminSupabase.from('customers').insert(customer);

    if (insertError) {
      console.error('Error inserting customer record:', insertError);
      
      // Rollback: Delete the auth user if customer creation fails
      console.log("Rolling back - deleting auth user due to customer creation failure");
      await adminSupabase.auth.admin.deleteUser(userId);
      
      return { 
        success: false, 
        message: insertError.message || 'Failed to insert customer record' 
      };
    }

    // Step 3: Create a profile to link the auth user to the customer
    console.log("Step 3: Creating profile to link auth user and customer");
    const profileData = {
      id: userId, // Use auth user ID as profile ID
      customer_id: userId, // Link to customer
      email: customerData.email,
      created_at: new Date().toISOString()
    };

    const { error: profileError } = await adminSupabase.from('profiles').insert(profileData);
    
    if (profileError) {
      console.error('Error creating profile:', profileError);
      
      // Rollback: Delete customer and auth user
      console.log("Rolling back - deleting customer and auth user due to profile creation failure");
      await adminSupabase.from('customers').delete().eq('id', userId);
      await adminSupabase.auth.admin.deleteUser(userId);
      
      return { 
        success: false, 
        message: profileError.message || 'Failed to create profile' 
      };
    }

    // Step 4: Assign products if provided
    if (productIds.length > 0) {
      console.log("Step 4: Assigning products to customer");
      
      // First try direct insert approach
      try {
        const customerProductRecords = productIds.map(productId => ({
          customer_id: userId,
          product_id: productId,
          created_at: new Date().toISOString()
        }));
        
        const { error: bulkInsertError } = await adminSupabase
          .from('customer_products')
          .insert(customerProductRecords);
          
        if (bulkInsertError) {
          console.error("Error with direct insertion of products:", bulkInsertError);
          
          // Try with RPC function as fallback
          const { error: rpcError } = await adminSupabase.rpc('admin_assign_products', {
            customer_id_param: userId,
            product_ids_param: productIds
          });
          
          if (rpcError) {
            console.error("RPC fallback also failed:", rpcError);
            // Note: Not rolling back the whole operation, as products can be added later
          }
        }
      } catch (productError) {
        console.error("Exception during product assignment:", productError);
        // Continue - product assignment is not critical
      }
    }

    return { 
      success: true, 
      user: {
        id: userId,
        email: customerData.email,
        password: tempPassword,
        emailConfirmed: true
      },
      customer,
      customerId: userId,
      message: "Customer and auth user created successfully"
    };
  } catch (error) {
    console.error('Unexpected error in createCustomerWithProducts:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
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