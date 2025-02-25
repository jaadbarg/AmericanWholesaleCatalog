// src/app/not-found.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg text-center"
      >
        <div className="mb-6">
          <Image 
            src="/favicon.png" 
            alt="American Wholesalers Logo" 
            width={80} 
            height={80} 
            className="mx-auto"
          />
        </div>
        
        <motion.h1 
          className="text-9xl font-bold text-blue-900 mb-4"
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          404
        </motion.h1>
        
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Page Not Found</h2>
        
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            onClick={() => window.history.back()}
            variant="outline"
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Go Back
          </Button>
          
          <Link href="/">
            <Button
              icon={<Home className="h-4 w-4" />}
            >
              Back to Home
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}