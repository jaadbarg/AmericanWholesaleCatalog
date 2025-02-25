'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCustomerWithProducts, Product } from '@/lib/supabase/client'
import { Search, Filter, Check, UserPlus, AlertCircle } from 'lucide-react'

interface NewCustomerFormProps {
  products: Product[]
}

export default function NewCustomerForm({ products }: NewCustomerFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  // Get unique categories from products
  const categories = ['all', ...Array.from(new Set(
    products
      .map(p => p.category)
      .filter(Boolean) as string[]
  ))].sort()

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      setError('Please fill in all required fields')
      return
    }
    
    setIsSubmitting(true)
    setError('')
    
    try {
      const result = await createCustomerWithProducts(
        { name, email },
        Array.from(selectedProducts)
      )
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create customer')
      }
      
      // Redirect to customer management or the new customer page
      router.push('/admin/customers')
    } catch (error) {
      console.error('Error creating customer:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold mb-2">Create New Customer</h2>
        <p className="text-gray-500">
          Fill in the customer details and select products for their catalog.
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
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
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
                Showing {filteredProducts.length} of {products.length} products. 
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
        
        {/* Error message */}
        {error && (
          <div className="px-6 py-3 text-red-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Form actions */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 mr-3 border border-gray-300 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => router.push('/admin/customers')}
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
                <UserPlus className="h-4 w-4" />
                <span>Create Customer</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}