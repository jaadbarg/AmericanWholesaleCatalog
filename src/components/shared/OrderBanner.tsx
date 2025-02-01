// src/components/shared/OrderBanner.tsx
'use client'

import { Clock, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function OrderBanner() {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) {
    return (
      <div className="h-8 bg-white fixed top-0 left-0 right-0 z-20" />
    )
  }

  return (
    <motion.div 
      className="fixed top-0 left-0 right-0 z-50 bg-blue-900 text-white"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
    >
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center justify-center flex-1">
          <Clock className="h-4 w-4 mr-2" />
          <p className="text-sm">Orders placed before 3:00 PM will be delivered next business day</p>
        </div>
        <button 
          onClick={() => setIsDismissed(true)}
          className="ml-4 p-1 hover:bg-blue-800 rounded-full transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}