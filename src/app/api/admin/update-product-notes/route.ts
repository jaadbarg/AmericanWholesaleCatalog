// API route for updating product notes
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

export async function POST(request: NextRequest) {
  try {
    // Admin API Key auth check
    const authHeader = request.headers.get('authorization') || ''
    const apiKey = authHeader.replace('Bearer ', '')
    
    if (apiKey !== (process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'test-api-key')) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }
    
    // Get request body
    const { customerId, productId, notes } = await request.json()
    
    if (!customerId || !productId) {
      return NextResponse.json(
        { error: 'Missing required parameters: customerId and productId are required' },
        { status: 400 }
      )
    }
    
    // Update the customer product notes using admin client
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
      { error: 'Internal server error', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}