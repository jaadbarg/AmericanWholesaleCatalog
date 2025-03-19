// src/lib/utils/adminUtils.ts
export const ADMIN_EMAILS = ['admin@americanwholesalers.us']

export function isAdmin(email: string | undefined): boolean {
  return ADMIN_EMAILS.includes(email || '')
}

// RLS bypass functions - used when running admin operations
// These functions provide a standardized way to add custom RPC functions
// that can bypass row level security for admin operations.

export async function createAdminRPC(supabase: any, name: string, params: Record<string, any>) {
  try {
    const { data, error } = await supabase.rpc(name, params)
    
    if (error) {
      console.error(`Error executing admin RPC ${name}:`, error)
      throw error
    }
    
    return { data, error: null }
  } catch (error) {
    console.error(`Unexpected error in admin RPC ${name}:`, error)
    return { data: null, error }
  }
}