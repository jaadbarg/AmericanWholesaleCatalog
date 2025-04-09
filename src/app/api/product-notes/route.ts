// API route for updating product notes
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

export async function POST(request: NextRequest) {
  try {
    // Get the authorization cookie from the request
    const cookieHeader = request.headers.get('cookie')
    
    // Create a supabase client that will use the cookies
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        global: {
          headers: {
            cookie: cookieHeader || '',
          },
        },
      }
    )
    
    // Get the session from the client
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get request body
    const { customerId, productId, notes } = await request.json()
    
    if (!customerId || !productId) {
      return NextResponse.json(
        { error: 'Missing required parameters: customerId and productId are required' },
        { status: 400 }
      )
    }
    
    // Check user has permission (either admin or owns this customer ID)
    const { data: profile } = await supabase
      .from('profiles')
      .select('customer_id')
      .eq('id', session.user.id)
      .single()
    
    const isAdmin = session.user.email === 'admin@americanwholesalers.us'
    const isOwner = profile?.customer_id === customerId
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to update this resource' },
        { status: 403 }
      )
    }
    
    // Update the customer product notes
    const { error } = await adminSupabase
      .from('customer_products')
      .update({ notes })
      .eq('customer_id', customerId)
      .eq('product_id', productId)
    
    if (error) {
      console.error('Error updating product notes:', error)
      return NextResponse.json(
        { error: 'Failed to update product notes: ' + error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in product notes API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}