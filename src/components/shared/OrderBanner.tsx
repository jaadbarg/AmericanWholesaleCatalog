// src/components/shared/OrderBanner.tsx
'use client'

import { Clock } from 'lucide-react'
import { motion } from 'framer-motion'

export default function OrderBanner() {
  return (
    <motion.div 
      className="fixed top-0 left-0 right-0 z-50 bg-blue-900 text-white py-2"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
    >
      <div className="container mx-auto px-4 flex items-center justify-center text-sm">
        <Clock className="h-4 w-4 mr-2" />
        <p>Orders placed before 3:00 PM will be delivered next business day</p>
      </div>
    </motion.div>
  )
}