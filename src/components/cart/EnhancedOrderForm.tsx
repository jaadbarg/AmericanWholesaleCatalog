// src/components/cart/EnhancedOrderForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { isWithinOrderWindow, getNextBusinessDay, getValidBusinessDays, isPublicHoliday } from '@/lib/utils/orderUtils'
import { AlertCircle, Calendar, FileText, Check, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TextArea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { sendOrderConfirmationEmail, sendNewOrderNotificationToAdmin } from '@/lib/utils/emailUtils'

// Helper function to format date without timezone issues
function formatDateWithoutTimezoneIssue(dateString: string) {
  // Split the date string into components
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Format using en-US locale with components (avoids timezone shift)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(new Date(year, month - 1, day)); // month is 0-indexed in JavaScript Dates
}

export function EnhancedOrderForm() {
    const router = useRouter()
    const supabase = createClientComponentClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { items, clearCart } = useCart()
    const [orderWindow, setOrderWindow] = useState(isWithinOrderWindow())
    const [notes, setNotes] = useState('')
    const [validDeliveryDates, setValidDeliveryDates] = useState<Date[]>([])
    const [deliveryDate, setDeliveryDate] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    // Check order window status on mount and every minute
    useEffect(() => {
      // Initial check
      const initialWindow = isWithinOrderWindow()
      setOrderWindow(initialWindow)
      updateValidDeliveryDates(initialWindow.canScheduleNextDay)
      
      // Set up interval - check more frequently (every minute) to catch the cutoff time exactly
      const interval = setInterval(() => {
        const currentWindow = isWithinOrderWindow()
        
        // Only update if the canScheduleNextDay status has changed
        if (currentWindow.canScheduleNextDay !== orderWindow.canScheduleNextDay) {
          console.log('Order window changed', { 
            previous: orderWindow.canScheduleNextDay, 
            current: currentWindow.canScheduleNextDay 
          })
          setOrderWindow(currentWindow)
          // Update delivery dates when the order window changes
          updateValidDeliveryDates(currentWindow.canScheduleNextDay)
        }
      }, 60 * 1000) // Check every minute

      return () => clearInterval(interval)
    }, [orderWindow.canScheduleNextDay])

    // Generate valid delivery dates that are business days
    const updateValidDeliveryDates = (canScheduleNextDay = orderWindow.canScheduleNextDay) => {
      let validDates = getValidBusinessDays(30) // Get next 30 days of valid business days
      
      // If after cutoff, remove next business day from available options
      if (!canScheduleNextDay) {
        const nextBusinessDay = getNextBusinessDay()
        // Filter out the next business day from the options
        validDates = validDates.filter(date => 
          !(date.getFullYear() === nextBusinessDay.getFullYear() &&
            date.getMonth() === nextBusinessDay.getMonth() &&
            date.getDate() === nextBusinessDay.getDate())
        )
      }
      
      setValidDeliveryDates(validDates)
      
      // Set default delivery date
      if (validDates.length > 0) {
        // Use the first available date as default
        setDeliveryDate(validDates[0].toISOString().split('T')[0])
      }
    }

    // Initialize delivery dates on component mount
    useEffect(() => {
      updateValidDeliveryDates(orderWindow.canScheduleNextDay)
    }, [])
    
    // Update selected delivery date when validDeliveryDates changes
    useEffect(() => {
      if (validDeliveryDates.length > 0) {
        // Check if current delivery date is still valid
        const currentDateStr = deliveryDate
        const validDateStrings = validDeliveryDates.map(date => date.toISOString().split('T')[0])
        
        if (!validDateStrings.includes(currentDateStr)) {
          // If current date is not valid, select the first available date
          console.log('Updating delivery date as current selection is not valid anymore', {
            current: currentDateStr,
            newDate: validDeliveryDates[0].toISOString().split('T')[0],
            validDates: validDateStrings
          })
          setDeliveryDate(validDeliveryDates[0].toISOString().split('T')[0])
        }
      }
    }, [validDeliveryDates])

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      
      // Validate delivery date
      if (!deliveryDate) {
        setError('Please select a delivery date')
        return
      }
      
      // Check if the selected delivery date is valid and available for selection
      const selectedDate = new Date(deliveryDate)
      
      // Debug logging
      console.log('Delivery date validation:', {
        selectedDateString: deliveryDate,
        selectedDate,
        validDatesStrings: validDeliveryDates.map(d => d.toISOString().split('T')[0]),
        validDates: validDeliveryDates
      })
      
      // Convert all to ISO date strings for reliable comparison
      const selectedDateString = deliveryDate.split('T')[0]
      const validDateStrings = validDeliveryDates.map(date => 
        date.toISOString().split('T')[0]
      )
      
      // Check if the selected date is in our list of valid dates
      if (!validDateStrings.includes(selectedDateString)) {
        console.log('Date validation failed', {
          selectedDateString,
          validDateStrings
        })
        
        // Auto-correct by setting to first available date
        if (validDeliveryDates.length > 0) {
          const newDate = validDeliveryDates[0].toISOString().split('T')[0]
          setDeliveryDate(newDate)
          setError('Your selected delivery date was not valid. We\'ve selected the next available date for you.')
          return
        } else {
          setError('No valid delivery dates are available. Please try again later.')
          return
        }
      }
      
      setLoading(true)
      setError(null)
      setIsSubmitting(true)
  
      try {
        // 1. Get current user's profile and customer_id
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('Not authenticated')
  
        const { data: profile } = await supabase
          .from('profiles')
          .select('customer_id')
          .eq('id', session.user.id)
          .single()
  
        if (!profile?.customer_id) throw new Error('No customer profile found')

        // Get customer details for email
        const { data: customer } = await supabase
          .from('customers')
          .select('name, email')
          .eq('id', profile.customer_id)
          .single()

        if (!customer) throw new Error('Customer details not found')
  
        // 2. Create the order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_id: profile.customer_id,
            status: 'pending',
            delivery_date: deliveryDate,
            notes: notes.trim() || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()
  
        if (orderError) throw orderError
  
        // 3. Create order items
        const orderItems = items.map(item => ({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity,
          created_at: new Date().toISOString()
        }))
  
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems)
  
        if (itemsError) {
          // If there's an error with order items, delete the order to maintain consistency
          await supabase
            .from('orders')
            .delete()
            .eq('id', order.id)
          
          throw itemsError
        }

        // 4. Send emails
        const emailDetails = {
          orderNumber: order.id.slice(0, 8),
          customerEmail: customer.email,
          customerName: customer.name,
          items: items.map(item => ({
            item_number: item.item_number,
            description: item.description,
            quantity: item.quantity
          })),
          deliveryDate: formatDateWithoutTimezoneIssue(deliveryDate),
          notes: notes || undefined
        }

        await Promise.all([
          sendOrderConfirmationEmail(emailDetails),
          sendNewOrderNotificationToAdmin(emailDetails)
        ])
  
        // 5. Success! Show success state then clear cart and redirect
        setIsSuccess(true)
        
        setTimeout(() => {
          clearCart()
          router.push('/dashboard/orders')
          router.refresh()
        }, 2000)
  
      } catch (e) {
        console.error('Order submission error:', e)
        setError(e instanceof Error ? e.message : 'Failed to place order')
        setIsSubmitting(false)
      } finally {
        setLoading(false)
      }
    }

    // Success state
    if (isSuccess) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h3>
          <p className="text-gray-600 mb-6">
            Your order has been received and is being processed.
            You'll receive an email confirmation shortly.
          </p>
          <div className="text-sm text-gray-500">
            Redirecting to your orders page...
          </div>
        </motion.div>
      )
    }
  
    return (
        <div className="space-y-6">
          {/* Order timing information - more visually prominent and explanatory */}
          <div className={`p-4 rounded-lg border-2 ${
            orderWindow.canScheduleNextDay 
              ? 'bg-green-50 border-green-200' 
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-start">
              <Clock className={`h-6 w-6 mr-3 flex-shrink-0 mt-0.5 ${
                orderWindow.canScheduleNextDay ? 'text-green-600' : 'text-amber-600'
              }`} />
              <div>
                <h3 className={`font-medium ${
                  orderWindow.canScheduleNextDay ? 'text-green-800' : 'text-amber-800'
                }`}>
                  Order Timing
                </h3>
                <p className={`text-sm mt-1 ${
                  orderWindow.canScheduleNextDay ? 'text-green-700' : 'text-amber-700'
                }`}>
                  {orderWindow.message}
                </p>
              </div>
            </div>
          </div>
    
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-lg text-sm flex items-start"
              >
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
    
            {/* Clearer delivery date selection */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <label 
                htmlFor="delivery-date" 
                className="flex items-center font-medium text-gray-800 mb-2"
              >
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Select Delivery Date:
              </label>
              
              <select
                id="delivery-date"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="block w-full rounded-md border-2 border-gray-300 px-4 py-3 text-base shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-label="Select delivery date"
              >
                {validDeliveryDates.length > 0 ? (
                  validDeliveryDates.map((date) => {
                    const dateStr = date.toISOString().split('T')[0];
                    
                    // Format the date for display without timezone issues
                    const displayDate = new Intl.DateTimeFormat('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    }).format(date);
                    
                    // Highlight next business day
                    const isNextBusinessDay = date.getTime() === getNextBusinessDay().getTime();
                    
                    // Check if it's tomorrow by comparing date components instead of timestamps
                    const today = new Date();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(today.getDate() + 1);
                    
                    const isTomorrow = 
                      date.getDate() === tomorrow.getDate() && 
                      date.getMonth() === tomorrow.getMonth() && 
                      date.getFullYear() === tomorrow.getFullYear();
                    
                    return (
                      <option key={dateStr} value={dateStr}>
                        {displayDate} {isNextBusinessDay && orderWindow.canScheduleNextDay ? ' (Next Business Day)' : ''}
                        {isTomorrow && orderWindow.canScheduleNextDay ? ' (Tomorrow)' : ''}
                      </option>
                    );
                  })
                ) : (
                  <option value="">Loading available delivery dates...</option>
                )}
              </select>
              
              <div className="mt-2 flex items-start">
                <div className="bg-blue-50 rounded-full p-1 mr-2 flex-shrink-0">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">
                  Deliveries are only available on business days (Monday-Friday, excluding holidays)
                </p>
              </div>
            </div>
    
            {/* Order notes - clearer instructions */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <label 
                htmlFor="notes" 
                className="flex items-center font-medium text-gray-800 mb-2"
              >
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Order Notes (Optional):
              </label>
              <TextArea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add any special delivery instructions or notes about your order here..."
                className="text-base border-2"
              />
              <p className="mt-2 text-sm text-gray-500">
                Examples: delivery location details, special handling instructions, etc.
              </p>
            </div>
    
            {/* Order summary and submit button */}
            <div className="bg-american-red-50 border-2 border-american-red-100 rounded-lg p-5">
              <h3 className="font-medium text-american-red-800 mb-3">Order Summary</h3>
              
              <div className="bg-white border border-american-red-100 rounded-lg p-3 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Total Items:</span>
                  <Badge variant="american" size="lg" className="text-base px-3 py-1">
                    {items.reduce((acc, item) => acc + item.quantity, 0)} units
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Delivery Date:</span>
                  <span className="font-medium text-gray-800">
                    {deliveryDate ? formatDateWithoutTimezoneIssue(deliveryDate) : 'Select a date'}
                  </span>
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={loading || items.length === 0 || isSubmitting}
                fullWidth
                size="lg"
                variant="american"
                icon={isSubmitting ? <Clock className="animate-spin" /> : <Check />}
                isLoading={isSubmitting}
                className="py-4 text-lg font-bold"
              >
                {isSubmitting ? 'Processing...' : 'Place Your Order'}
              </Button>
              
              <p className="text-center text-sm text-american-red-700 mt-3">
                By placing your order, you agree to our standard delivery terms
              </p>
            </div>
          </form>
        </div>
    )
}