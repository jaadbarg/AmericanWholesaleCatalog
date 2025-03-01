// src/components/shared/EnhancedOrderBanner.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, X, Info } from 'lucide-react'
import { isWithinOrderWindow } from '@/lib/utils/orderUtils'
import { Badge } from '@/components/ui/badge'

export default function EnhancedOrderBanner() {
  const [isDismissed, setIsDismissed] = useState(false)
  const [orderWindow, setOrderWindow] = useState(isWithinOrderWindow())
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update order window status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setOrderWindow(isWithinOrderWindow())
      setCurrentTime(new Date())
    }, 60000)
    
    return () => clearInterval(interval)
  }, [])

  // Check if banner has been dismissed in this session
  useEffect(() => {
    const bannerDismissed = sessionStorage.getItem('orderBannerDismissed')
    if (bannerDismissed) {
      setIsDismissed(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem('orderBannerDismissed', 'true')
  }

  // Format time to show cutoff time
  // const formattedTime = currentTime.toLocaleTimeString([], { 
  //   hour: '2-digit', 
  //   minute: '2-digit' 
  // })
  
  // Show remaining time until cutoff
  const getRemainingTime = () => {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    
    // If it's already after 3 PM, return empty string
    if (hours >= 15) return ''
    
    const remainingHours = 14 - hours
    const remainingMinutes = 60 - minutes
    
    // Format remaining time
    let timeString = ''
    if (remainingHours > 0) {
      timeString += `${remainingHours}h `
    }
    timeString += `${remainingMinutes}m`
    
    return timeString
  }
  
  const remainingTime = getRemainingTime()

  if (isDismissed) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div 
        className={`fixed top-0 left-0 right-0 z-50 ${
          orderWindow.canScheduleNextDay ? 'bg-american-red-700' : 'bg-amber-600'
        } text-white`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        exit={{ y: -100 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="container mx-auto px-4 py-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center flex-1">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                <p className="text-sm">
                  {orderWindow.canScheduleNextDay ? (
                    <>
                      Orders placed before <span className="font-bold">3:00 PM</span> will be delivered next business day
                      {remainingTime && (
                        <Badge 
                          variant="american" 
                          className="ml-2 bg-white/20"
                          rounded
                        >
                          {remainingTime} remaining
                        </Badge>
                      )}
                    </>
                  ) : (
                    <>
                      After 3:00 PM cutoff. Next-day delivery is not available.
                    </>
                  )}
                </p>
              </div>
            </div>
            <button 
              onClick={handleDismiss}
              className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Animated progress bar showing time until cutoff */}
        {orderWindow.canScheduleNextDay && (
          <motion.div 
            className="h-0.5 bg-white/30"
            initial={{ width: "100%" }}
            animate={{ 
              width: `${((15 * 60) - (currentTime.getHours() * 60 + currentTime.getMinutes())) / (15 * 60) * 100}%` 
            }}
            transition={{ ease: "linear", duration: 0 }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}