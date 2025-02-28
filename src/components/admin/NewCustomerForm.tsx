'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCustomerWithProducts, Product, supabase } from '@/lib/supabase/client'
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

  // State for showing generated password
  const [createdUser, setCreatedUser] = useState<{
    id: string;
    email: string;
    password: string;
    emailConfirmed?: boolean;
  } | null>(null);
  
  // Flags for different account modes
  const [isTestMode, setIsTestMode] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

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
      // Step 1: Create the auth user with our API route
      const authResponse = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'test-api-key'}`
        },
        body: JSON.stringify({
          name,
          email,
          productIds: Array.from(selectedProducts) // Include selected products in the request
        })
      });
      
      const authData = await authResponse.json();
      
      if (!authResponse.ok || !authData.success) {
        throw new Error(authData.error || 'Failed to create user account');
      }
      
      // Store the created user info (including temporary password)
      setCreatedUser(authData.user);
      
      // Set the various mode flags
      setIsTestMode(!!authData.testMode || !authData.authUserCreated);
      setNeedsVerification(!!authData.needsEmailVerification);
      
      // Check if we need to display manual instructions
      if (authData.instructions) {
        console.log("Manual instructions provided:", authData.instructions);
      }
      
      // No need to add products separately - they're now handled in the API call
      console.log("User and products created successfully");
      
      // Check if products were assigned
      if (selectedProducts.size > 0 && authData.customerId) {
        console.log(`${selectedProducts.size} products assigned to customer ID:`, authData.customerId);
      }
      
      // Don't redirect automatically - show the credentials first
      // router.push('/admin/customers')
    } catch (error) {
      console.error('Error creating customer:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
      setCreatedUser(null);
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
      
      {createdUser ? (
        // Success view - show credentials and completion message
        <div className="p-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">
              Customer Account Created Successfully!
            </h3>
            <div className="mb-4">
              <p className="text-green-700 mb-2">
                A new account has been created for {name} with the following credentials:
              </p>
              <div className="bg-white rounded border border-green-200 p-4 font-mono text-sm mb-4">
                <div className="mb-2">
                  <span className="font-semibold">Email:</span> {createdUser.email}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Temporary Password:</span> {createdUser.password}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">User ID:</span> {createdUser.id}
                </div>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-start">
                  <span className="text-amber-500 mr-2">⚠️</span>
                  <span className="text-amber-800">This temporary password will only be shown once. Make sure to save or share it securely.</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">ℹ️</span>
                  <span className="text-blue-800">
                    {isTestMode 
                      ? "IMPORTANT: The customer record was created, but the auth user creation failed due to database issues. You need to manually create an auth user in the Supabase dashboard." 
                      : "IMPORTANT: The customer must verify their email by clicking the link sent to them. Then they can use these credentials to log in. For testing, tell them to check spam folders if needed."}
                  </span>
                </div>
                
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <h4 className="font-medium text-amber-800 mb-1">Admin Instructions:</h4>
                  <p className="text-sm text-amber-700">
                    {isTestMode 
                      ? "You need to manually create an auth user for this customer:" 
                      : "If you need to bypass email verification:"}
                  </p>
                  <ol className="list-decimal ml-5 mt-1 text-sm text-amber-700">
                    <li>Go to Supabase Dashboard → Authentication → Users</li>
                    {isTestMode ? (
                      <>
                        <li>Click "Add User" and enter email: <code className="bg-amber-100 px-1 py-0.5 rounded">{createdUser.email}</code></li>
                        <li>Set password to <code className="bg-amber-100 px-1 py-0.5 rounded">Welcome123!</code> and check "Auto-confirm"</li>
                        <li>After creating the user, they can log in with these credentials</li>
                      </>
                    ) : (
                      <>
                        <li>Find this user and manually confirm their email</li>
                        <li>Use this SQL query in the Supabase SQL Editor: <code className="bg-amber-100 px-1 py-0.5 rounded">UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = '{createdUser.email}';</code></li>
                        <li>After running the SQL query, they can log in with the credentials shown above</li>
                      </>
                    )}
                  </ol>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                onClick={() => router.push('/admin/customers')}
              >
                Go to Customer List
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Creation form
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
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start text-sm">
                <span className="text-blue-500 mr-2">ℹ️</span>
                <p className="text-blue-800">
                  When you create a customer account, a temporary password will be generated.
                  The customer can use this password to log in to the platform.
                </p>
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
            <div className="px-6 py-3 text-red-600 flex items-center gap-2 border-t">
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
      )}
    </div>
  )
}