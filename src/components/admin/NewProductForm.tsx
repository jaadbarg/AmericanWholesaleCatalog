'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Box, Save, AlertCircle, X, Check } from 'lucide-react'

interface NewProductFormProps {
  // Category props removed
}

export default function NewProductForm({}: NewProductFormProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  // Form state
  const [itemNumber, setItemNumber] = useState('')
  const [description, setDescription] = useState('')
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [itemNumberExists, setItemNumberExists] = useState(false)
  const [isCheckingItemNumber, setIsCheckingItemNumber] = useState(false)
  
  // Check if item number already exists
  const checkItemNumber = async (value: string) => {
    if (!value.trim()) return
    
    setIsCheckingItemNumber(true)
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .eq('item_number', value.trim())
        .maybeSingle()
      
      if (error) throw error
      
      setItemNumberExists(!!data)
    } catch (err) {
      console.error('Error checking item number:', err)
    } finally {
      setIsCheckingItemNumber(false)
    }
  }
  
  // Form validation
  const isFormValid = 
    itemNumber.trim() !== '' && 
    description.trim() !== '' && 
    !itemNumberExists
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      setError('Please fill in all required fields and fix any validation errors')
      return
    }
    
    setIsSubmitting(true)
    setError('')
    
    try {
      // Use our admin RPC function to bypass RLS
      const { data: productId, error: rpcError } = await supabase.rpc('admin_create_product', {
        item_number_param: itemNumber.trim(),
        description_param: description.trim(),
        category_param: null
      })
      
      if (rpcError) {
        // Check if the error is about duplicate item numbers
        if (rpcError.message.includes('item number already exists')) {
          setItemNumberExists(true)
        }
        throw new Error(rpcError.message || 'Failed to create product')
      }
      
      if (!productId) {
        throw new Error('Failed to create product - no ID returned')
      }
      
      setSuccess(true)
      
      // Redirect back to products page after short delay
      setTimeout(() => {
        router.push('/admin/products')
        router.refresh()
      }, 1500)
      
    } catch (error) {
      console.error('Error creating product:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold mb-2">Product Information</h2>
        <p className="text-gray-500">
          Add a new product to your catalog. Products can later be assigned to specific customers.
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-6">
          {/* Item Number */}
          <div>
            <label htmlFor="itemNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Item Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="itemNumber"
                type="text"
                value={itemNumber}
                onChange={(e) => {
                  setItemNumber(e.target.value)
                  if (itemNumberExists) setItemNumberExists(false)
                }}
                onBlur={() => checkItemNumber(itemNumber)}
                placeholder="e.g. WF-1234 or BLT-XL-RED"
                className={`block w-full px-3 py-2 border ${
                  itemNumberExists ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                required
              />
              
              {isCheckingItemNumber && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="h-4 w-4 border-2 border-b-transparent border-gray-400 rounded-full animate-spin"></div>
                </div>
              )}
              
              {!isCheckingItemNumber && itemNumberExists && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-red-500">
                  <X className="h-5 w-5" />
                </div>
              )}
              
              {!isCheckingItemNumber && itemNumber && !itemNumberExists && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-green-500">
                  <Check className="h-5 w-5" />
                </div>
              )}
            </div>
            
            {itemNumberExists ? (
              <p className="mt-1 text-sm text-red-600">
                A product with this item number already exists.
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Use the unique identifier for inventory tracking e.g. AIO012
              </p>
            )}
          </div>
          
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="e.g. Professional-grade widget with reinforced steel frame and custom fittings"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            ></textarea>
            <p className="mt-1 text-xs text-gray-500">
              Provide a detailed description that will help customers identify this product.
            </p>
          </div>
          
          {/* Category removed */}
        </div>
        
        {/* Status messages */}
        {error && (
          <div className="px-6 py-3 text-red-600 flex items-center gap-2 bg-red-50 border-t border-b border-red-100">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="px-6 py-3 text-green-600 flex items-center gap-2 bg-green-50 border-t border-b border-green-100">
            <Check className="h-5 w-5" />
            <span>Product created successfully. Redirecting...</span>
          </div>
        )}
        
        {/* Form actions */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 mr-3 border border-gray-300 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => router.push('/admin/products')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              isSubmitting || !isFormValid
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Create Product</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}