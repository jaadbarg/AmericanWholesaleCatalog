// src/app/(protected)/layout.tsx
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/shared/Navbar'
import OrderBanner from '@/components/shared/OrderBanner'

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
    <div>
      <OrderBanner />
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8"> {/* Adjusted padding-top to account for banner + navbar */}
        {children}
      </main>
    </div>
  )
}