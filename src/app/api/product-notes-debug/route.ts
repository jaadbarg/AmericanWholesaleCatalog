// Debug API for product notes
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie')
    
    // Create supabase client with cookies
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
    
    // Get the session
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      return NextResponse.json({ 
        error: error.message,
        hasCookie: !!cookieHeader,
        cookieLength: cookieHeader?.length 
      }, { status: 500 })
    }
    
    // Return debug info
    return NextResponse.json({
      isAuthenticated: !!data.session,
      userId: data.session?.user?.id || null,
      userEmail: data.session?.user?.email || null,
      hasCookie: !!cookieHeader,
      cookieLength: cookieHeader?.length
    })
  } catch (error) {
    console.error('Error in product notes debug API:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}