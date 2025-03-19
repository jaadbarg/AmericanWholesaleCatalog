'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Search, Filter, Check, Save, AlertCircle } from 'lucide-react'

interface Product {
  id: string
  item_number: string
  description: string
  category: string | null
  selected?: boolean
}

interface Customer {
  id: string
  name: string
  email: string
  phone?: string | null
  address?: string | null
  company?: string | null
  created_at: string
  updated_at: string
}

interface EditCustomerFormProps {
  customer: Customer
  initialProducts: Product[]
}

export default function EditCustomerForm({ customer, initialProducts }: EditCustomerFormProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  // Form state
  const [name, setName] = useState(customer.name)
  const [email, setEmail] = useState(customer.email)
  
  // Product selection state
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(initialProducts.filter(p => p.selected).map(p => p.id))
  )
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteProgress, setDeleteProgress] = useState(0)
  const [deleteWarningStage, setDeleteWarningStage] = useState(0)
  const requiredDeleteText = `DELETE ${customer.name.toUpperCase()}`
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  // Get unique categories from products
  const categories = ['all', ...Array.from(new Set(
    initialProducts
      .map(p => p.category)
      .filter(Boolean) as string[]
  ))].sort()

  // Filter products based on search and category
  const filteredProducts = initialProducts.filter(product => {
    const matchesSearch = product.item_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  // Toggle product selection
  const toggleProduct = (productId: string) => {
    const newSelectedProducts = new Set(selectedProducts)
    if (newSelectedProducts.has(productId)) {
      newSelectedProducts.delete(productId)
    } else {
      newSelectedProducts.add(productId)
    }
    setSelectedProducts(newSelectedProducts)
  }

  // Form validation
  const isFormValid = name.trim() !== '' && email.trim() !== ''
  const hasChanges = 
    name !== customer.name || 
    email !== customer.email || 
    !setsAreEqual(
      selectedProducts, 
      new Set(initialProducts.filter(p => p.selected).map(p => p.id))
    )
  
  // Compare two sets for equality
  function setsAreEqual(a: Set<string>, b: Set<string>) {
    if (a.size !== b.size) return false
    for (const item of a) {
      if (!b.has(item)) return false
    }
    return true
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      setError('Please fill in all required fields')
      return
    }
    
    if (!hasChanges) {
      setError('No changes to save')
      return
    }
    
    setIsSubmitting(true)
    setError('')
    setSuccess(false)
    
    try {
      // 1. Update customer information using our helper function
      // Only update if name or email has changed
      if (name !== customer.name || email !== customer.email) {
        const { success: updateSuccess, message: updateMessage } = await import('@/lib/supabase/client')
          .then(module => module.updateCustomer(customer.id, name, email));
        
        if (!updateSuccess) {
          throw new Error(updateMessage || 'Failed to update customer');
        }
      }
      
      // 2. Handle product changes if necessary
      const initialSelectedProductIds = new Set(
        initialProducts.filter(p => p.selected).map(p => p.id)
      )
      
      // Find products to add (in selectedProducts but not in initialSelected)
      const productsToAdd = Array.from(selectedProducts)
        .filter(id => !initialSelectedProductIds.has(id))
      
      // Find products to remove (in initialSelected but not in selectedProducts)
      const productsToRemove = Array.from(initialSelectedProductIds)
        .filter(id => !selectedProducts.has(id))
      
      // Add new products
      if (productsToAdd.length > 0) {
        const { success: addSuccess, message: addMessage } = await import('@/lib/supabase/client')
          .then(module => module.addProductsToCustomer(customer.id, productsToAdd));
        
        if (!addSuccess) {
          throw new Error(`Error adding products: ${addMessage || 'Failed to add products'}`);
        }
      }
      
      // Remove products
      if (productsToRemove.length > 0) {
        const { success: removeSuccess, message: removeMessage } = await import('@/lib/supabase/client')
          .then(module => module.removeProductsFromCustomer(customer.id, productsToRemove));
        
        if (!removeSuccess) {
          throw new Error(`Error removing products: ${removeMessage || 'Failed to remove products'}`);
        }
      }
      
      setSuccess(true)
      
      // Redirect back to customer detail page after short delay
      setTimeout(() => {
        router.push(`/admin/customers/${encodeURIComponent(customer.id)}`)
        router.refresh()
      }, 1500)
      
    } catch (error) {
      console.error('Error updating customer:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle customer deletion
  const handleDeleteCustomer = async () => {
    if (deleteConfirmText !== requiredDeleteText) {
      setError('Confirmation text does not match')
      return
    }
    
    setIsDeletingCustomer(true)
    setError('')
    
    try {
      // Use our helper function to delete customer and all related data
      const { success: deleteSuccess, message: deleteMessage } = await import('@/lib/supabase/client')
        .then(module => module.deleteCustomer(customer.id));
      
      if (!deleteSuccess) {
        throw new Error(`Error deleting customer: ${deleteMessage || 'Failed to delete customer'}`)
      }
      
      // Redirect back to customers list
      router.push('/admin/customers')
      router.refresh()
      
    } catch (error) {
      console.error('Error deleting customer:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
      setIsDeletingCustomer(false)
    }
  }

  // Handle delete button clicks - increase warning level
  const handleDeleteButtonClick = () => {
    if (deleteWarningStage === 0) {
      setDeleteWarningStage(1)
    } else if (deleteWarningStage === 1) {
      setDeleteWarningStage(2)
    } else {
      setShowDeleteConfirm(true)
    }
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold mb-2">Edit Customer</h2>
        <p className="text-gray-500">
          Update customer details and product catalog.
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Customer Information */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium mb-4">Customer Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
                {email !== customer.email && (
                  <div className="absolute right-0 top-full mt-1 z-10 bg-yellow-50 border border-yellow-100 shadow-sm rounded-md p-2 text-xs text-yellow-800 w-full md:w-72">
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500 mt-0.5 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>
                        <strong>Important:</strong> Changing this email will update the customer's login credentials. The customer will need to use this new email to log in.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Product Catalog */}
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Product Catalog</h3>
          <p className="text-gray-500 mb-4">
            Select the products that will be available in this customer's catalog.
          </p>
          
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            {/* Search input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search by item number or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Category filter */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Products selection */}
          <div className="border rounded-lg overflow-hidden">
            <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {filteredProducts.length} of {initialProducts.length} products. 
                <span className="ml-2 font-medium text-blue-600">
                  {selectedProducts.size} selected
                </span>
              </div>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <div 
                  key={product.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedProducts.has(product.id) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleProduct(product.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{product.item_number}</div>
                      <div className="text-sm text-gray-500 mt-1">{product.description}</div>
                      {product.category && (
                        <div className="text-xs text-gray-400 mt-2">{product.category}</div>
                      )}
                    </div>
                    <div className={`${
                      selectedProducts.has(product.id) 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    } p-1 rounded-full`}>
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-8 text-center text-gray-500">
                  No products match your search criteria
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Status messages */}
        {error && (
          <div className="px-6 py-3 text-red-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="px-6 py-3 text-green-600 flex items-center gap-2">
            <Check className="h-5 w-5" />
            <span>Customer updated successfully. Redirecting...</span>
          </div>
        )}
        
        {/* Danger Zone */}
        <div className="p-6 border-t border-red-100 mt-6">
          <h3 className="text-lg font-medium mb-4 text-red-700">Danger Zone</h3>
          
          {!showDeleteConfirm ? (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-red-800 mb-1">Delete this customer</h4>
                  <p className="text-red-700 text-sm mb-4">
                    This action cannot be undone. This will permanently delete the customer, 
                    their product access, and remove all associations.
                  </p>
                  
                  <button
                    type="button"
                    onClick={handleDeleteButtonClick}
                    className={`
                      px-4 py-2 rounded-md text-sm font-medium transition-all
                      ${deleteWarningStage === 0 
                        ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                        : deleteWarningStage === 1 
                          ? 'bg-red-300 text-red-800 hover:bg-red-400 animate-pulse' 
                          : 'bg-red-500 text-white hover:bg-red-600 animate-bounce'
                      }
                    `}
                  >
                    {deleteWarningStage === 0 
                      ? 'Delete Customer' 
                      : deleteWarningStage === 1 
                        ? 'Are you really sure? Click again!' 
                        : 'FINAL WARNING! THIS IS PERMANENT!'
                    }
                  </button>
                </div>
                
                <div className="ml-4">
                  {deleteWarningStage > 0 && (
                    <div className="p-3 bg-red-200 rounded-full text-red-800 animate-pulse">
                      <span className="text-xl font-bold">⚠️</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <div className="mb-4">
                <h4 className="font-medium text-red-800 mb-1 text-lg">⚠️ Final Confirmation Required</h4>
                <p className="text-red-700 mb-1">
                  You are about to permanently delete <strong>{customer.name}</strong>
                </p>
                <p className="text-red-700 mb-4">
                  To confirm, please type <strong className="font-mono bg-red-100 px-1">{requiredDeleteText}</strong> below
                </p>
                
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => {
                    setDeleteConfirmText(e.target.value)
                    setDeleteProgress(Math.min(100, Math.round((e.target.value.length / requiredDeleteText.length) * 100)))
                  }}
                  className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 font-mono bg-white"
                  placeholder={`Type ${requiredDeleteText} here`}
                />
                
                <div className="mt-3 w-full bg-red-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${deleteProgress < 100 ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${deleteProgress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirmText('')
                    setDeleteWarningStage(0)
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  type="button"
                  onClick={handleDeleteCustomer}
                  disabled={deleteConfirmText !== requiredDeleteText || isDeletingCustomer}
                  className={`px-4 py-2 rounded-md font-medium ${
                    deleteConfirmText !== requiredDeleteText || isDeletingCustomer
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isDeletingCustomer ? (
                    <span className="flex items-center">
                      <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                      Deleting...
                    </span>
                  ) : (
                    'Permanently Delete Customer'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Form actions */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 mr-3 border border-gray-300 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => router.push(`/admin/customers/${encodeURIComponent(customer.id)}`)}
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
      </form>
    </div>
  )
}