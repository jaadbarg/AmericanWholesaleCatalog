// src/app/(protected)/layout.tsx
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'
import { EnhancedNavbar } from '@/components/shared/EnhancedNavbar'
import EnhancedOrderBanner from '@/components/shared/EnhancedOrderBanner'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedOrderBanner />
      <EnhancedNavbar />
      <main className="container mx-auto px-4 pt-32 pb-16 max-w-7xl">
        {children}
      </main>
      <footer className="bg-white border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} American Wholesalers. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}