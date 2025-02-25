// src/components/shared/AppProvider.tsx
'use client'

import React from 'react'
import { ToastProvider } from '@/components/ui/toast'
import { motion } from 'framer-motion'

/**
 * AppProvider wraps the application with all necessary context providers
 * and provides global animations and layouts
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
    </ToastProvider>
  )
}