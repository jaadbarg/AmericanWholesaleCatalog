'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the AI Order Assistant component to reduce initial load time
const AIOrderAssistant = dynamic(
  () => import('@/components/products').then(mod => ({ default: mod.AIOrderAssistant })),
  { ssr: false }
)

export default function ClientAIOrderAssistant({ 
  products, 
  customerName, 
  previousOrders,
  customerId
}: { 
  products: any[]
  customerName: string
  previousOrders?: any[]
  customerId: string
}) {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-full">Loading AI assistant...</div>}>
      <AIOrderAssistant 
        products={products} 
        customerName={customerName} 
        previousOrders={previousOrders}
        customerId={customerId}
      />
    </Suspense>
  )
}