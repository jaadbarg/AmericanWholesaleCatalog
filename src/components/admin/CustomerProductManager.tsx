'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Save, CheckCircle, XCircle, Check } from 'lucide-react'
import { 
  addProductsToCustomer,
  removeProductsFromCustomer,
  Product
} from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ExtendedProduct extends Product {
  selected: boolean
}

interface CustomerProductManagerProps {
  customerId: string
  initialProducts: ExtendedProduct[]
  customerName: string
}

export function CustomerProductManager({ 
  customerId, 
  initialProducts, 
  customerName 
}: CustomerProductManagerProps) {
  const router = useRouter()
  const [products, setProducts] = useState<ExtendedProduct[]>(initialProducts)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  
  // Get unique categories from products
  const categories = ['all', ...Array.from(new Set(
    initialProducts
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

  // Stats
  const totalProducts = products.length
  const selectedProducts = products.filter(p => p.selected).length

  // Toggle product selection
  const toggleProduct = (productId: string) => {
    setProducts(prev => 
      prev.map(p => p.id === productId ? { ...p, selected: !p.selected } : p)
    )
  }

  // Bulk selection options
  const selectAll = () => {
    setProducts(prev => prev.map(p => ({ ...p, selected: true })))
  }

  const deselectAll = () => {
    setProducts(prev => prev.map(p => ({ ...p, selected: false })))
  }

  const selectCategory = (category: string) => {
    setProducts(prev => 
      prev.map(p => 
        p.category === category ? { ...p, selected: true } : p
      )
    )
  }

  // Handle saving changes
  const saveChanges = async () => {
    setSaving(true)
    setSaveSuccess(false)
    setSaveError('')
    
    try {
      // Find original selection
      const originalSelected = new Set(
        initialProducts.filter(p => p.selected).map(p => p.id)
      )
      
      // Find current selection
      const currentSelected = new Set(
        products.filter(p => p.selected).map(p => p.id)
      )
      
      // Find products to add (in current but not in original)
      const toAdd = products
        .filter(p => p.selected && !originalSelected.has(p.id))
        .map(p => p.id)
      
      // Find products to remove (in original but not in current)
      const toRemove = initialProducts
        .filter(p => p.selected && !currentSelected.has(p.id))
        .map(p => p.id)
      
      // Make API calls to update
      if (toAdd.length > 0) {
        const result = await addProductsToCustomer(customerId, toAdd)
        if (!result.success) {
          throw new Error(result.message || 'Failed to add products')
        }
      }
      
      if (toRemove.length > 0) {
        const result = await removeProductsFromCustomer(customerId, toRemove)
        if (!result.success) {
          throw new Error(result.message || 'Failed to remove products')
        }
      }
      
      // Update the initialProducts reference
      setSaveSuccess(true)
      
      // Refresh the page data after a successful save
      router.refresh()
    } catch (error) {
      console.error('Error saving product changes:', error)
      setSaveError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg border shadow-sm mb-6">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-2">Product Catalog Management</h2>
          <p className="text-gray-500">
            Select products for {customerName} to see in their catalog. 
            Changes won't be saved until you click the Save button.
          </p>
        </div>
        
        <div className="p-6 flex flex-col md:flex-row justify-between gap-4">
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
        
        {/* Bulk actions */}
        <div className="px-6 py-3 bg-gray-100 border-t flex flex-wrap gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-1 text-xs font-medium bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="px-3 py-1 text-xs font-medium bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            Deselect All
          </button>
          <div className="border-l border-gray-300 mx-1"></div>
          
          {categories.filter(c => c !== 'all').map(category => (
            <button
              key={category}
              onClick={() => selectCategory(category)}
              className="px-3 py-1 text-xs font-medium bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            >
              Select {category}
            </button>
          ))}
        </div>
        
        {/* Stats bar */}
        <div className="px-6 py-3 bg-gray-50 border-t border-b flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="text-sm text-gray-500">
            Showing {filteredProducts.length} of {totalProducts} products. 
            <span className="ml-2 font-medium text-blue-600">
              {selectedProducts} selected
            </span>
          </div>
          
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              saving 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            onClick={saveChanges}
            disabled={saving}
          >
            {saving ? (
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
        
        {/* Save status message */}
        {saveSuccess && (
          <div className="m-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Changes saved successfully</span>
          </div>
        )}
        
        {saveError && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span>Error: {saveError}</span>
          </div>
        )}
        
        {/* Products grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <div 
              key={product.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                product.selected 
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
                  product.selected 
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
    </>
  )
}