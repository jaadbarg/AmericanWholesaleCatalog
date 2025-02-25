// src/app/(protected)/profile/page.tsx
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { PasswordChangeForm } from '@/components/profile/PasswordChangeForm'

export default async function ProfilePage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return null // Protected layout will handle redirect
  }

  // Get the user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  // Get the customer data if available
  let customer = null
  if (profile?.customer_id) {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('id', profile.customer_id)
      .single()
    
    customer = data
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Account Information Section */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{session.user.email}</p>
            </div>
            
            {customer && (
              <>
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{customer.name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Account Created</p>
                  <p className="font-medium">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Password Change Section */}
        <PasswordChangeForm />
      </div>
    </div>
  )
}