'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Save, AlertCircle, X, Check, Trash } from 'lucide-react'
import { Product } from '@/lib/supabase/client'

interface EditProductFormProps {
  product: Product
}

export default function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  // Form state
  const [itemNumber, setItemNumber] = useState(product.item_number)
  const [description, setDescription] = useState(product.description)
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [itemNumberExists, setItemNumberExists] = useState(false)
  const [isCheckingItemNumber, setIsCheckingItemNumber] = useState(false)
  
  // Check if item number already exists (only if changed from original)
  const checkItemNumber = async (value: string) => {
    if (!value.trim() || value.trim() === product.item_number) {
      setItemNumberExists(false)
      return
    }
    
    setIsCheckingItemNumber(true)
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .eq('item_number', value.trim())
        .not('id', 'eq', product.id)
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
  
  // Check if form has changes
  const hasChanges = 
    itemNumber !== product.item_number ||
    description !== product.description
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      setError('Please fill in all required fields and fix any validation errors')
      return
    }
    
    if (!hasChanges) {
      setError('No changes to save')
      return
    }
    
    setIsSubmitting(true)
    setError('')
    
    try {
      // Use our admin RPC function to bypass RLS
      const { error: rpcError } = await supabase.rpc('admin_update_product', {
        product_id_param: product.id,
        item_number_param: itemNumber.trim(),
        description_param: description.trim(),
        category_param: null
      })
      
      if (rpcError) {
        // Check if the error is about duplicate item numbers
        if (rpcError.message.includes('item number already exists')) {
          setItemNumberExists(true)
        }
        throw new Error(rpcError.message || 'Failed to update product')
      }
      
      setSuccess(true)
      
      // Redirect back to products page after short delay
      setTimeout(() => {
        router.push('/admin/products')
        router.refresh()
      }, 1500)
      
    } catch (error) {
      console.error('Error updating product:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle product deletion
  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      // Use admin function to delete product
      const { error: deleteError } = await supabase.rpc('admin_delete_product', {
        product_id_param: product.id
      })
      
      if (deleteError) {
        // Special handling for products assigned to customers
        if (deleteError.message.includes('assigned to')) {
          throw new Error(`Cannot delete this product because it is assigned to customers. Remove product assignments first.`)
        }
        throw new Error(`Error deleting product: ${deleteError.message}`)
      }
      
      // Redirect back to products page
      router.push('/admin/products')
      router.refresh()
      
    } catch (error) {
      console.error('Error deleting product:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }
  
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold mb-2">Product Information</h2>
        <p className="text-gray-500">
          Update product details. Products can be assigned to specific customers.
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
              
              {!isCheckingItemNumber && itemNumber && !itemNumberExists && itemNumber !== product.item_number && (
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
        
        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete product <strong>{product.item_number}</strong>?
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash className="h-4 w-4 mr-1" />
                      Delete Product
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
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
            <span>Product updated successfully. Redirecting...</span>
          </div>
        )}
        
        {/* Form actions */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center px-4 py-2 border border-red-300 bg-white text-red-700 rounded-md hover:bg-red-50 transition-colors"
          >
            <Trash className="h-4 w-4 mr-1" />
            Delete Product
          </button>
          
          <div className="flex items-center">
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
                isSubmitting || !isFormValid || !hasChanges
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              disabled={isSubmitting || !isFormValid || !hasChanges}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}