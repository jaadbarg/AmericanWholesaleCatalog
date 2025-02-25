// Ensure this file is saved at: src/components/products/ProductsView.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { ProductCard } from '@/components/products/ProductCard'
import { motion } from 'framer-motion'
import { Search, Filter, X, Loader2 } from 'lucide-react'

// Define the product type
type Product = {
  id: string
  item_number: string
  description: string
  category: string | null
  customerNote: string
  customerId: string
}

// Helper function to sort products
function sortProducts(products: Product[]) {
  return products.sort((a, b) => {
    // Extract the alphabetic prefix and numeric parts
    const aMatch = a.description.match(/^([A-Za-z]+)(\d+)/)
    const bMatch = b.description.match(/^([A-Za-z]+)(\d+)/)
    
    if (!aMatch || !bMatch) {
      return a.description.localeCompare(b.description)
    }

    const [, aPrefix, aNumber] = aMatch
    const [, bPrefix, bNumber] = bMatch

    // First compare the alphabetic prefixes
    if (aPrefix !== bPrefix) {
      return aPrefix.localeCompare(bPrefix)
    }

    // If prefixes are the same, compare the numeric parts
    return parseInt(aNumber) - parseInt(bNumber)
  })
}

// Create a list of unique categories
function extractCategories(products: Product[]): string[] {
  const categories = products
    .map(p => p.category)
    .filter((category): category is string => category !== null)
  
  return [...new Set(categories)].sort()
}

export function ProductsView({ products }: { products: Product[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Extract categories for filter
  const categories = useMemo(() => extractCategories(products), [products])
  
  // Sort products
  const sortedProducts = useMemo(() => sortProducts(products), [products])
  
  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    
    return () => clearTimeout(timer)
  }, [])

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return sortedProducts.filter(product => {
      // Filter by search query
      const matchesSearch = 
        searchQuery === '' || 
        product.item_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.customerNote.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Filter by category
      const matchesCategory = 
        selectedCategory === null || 
        product.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
  }, [sortedProducts, searchQuery, selectedCategory])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Handle category selection
  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category)
    setIsFiltersOpen(false)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory(null)
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 text-blue-900 animate-spin mb-4" />
        <p className="text-gray-600">Loading your products...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header with title, search, and filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-4 md:mb-0">Your Products</h1>
        
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          {/* Filter button (mobile) */}
          <div className="md:hidden">
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50"
            >
              <Filter size={18} className="mr-2" />
              {selectedCategory ? `Category: ${selectedCategory}` : 'Filter by category'}
            </button>
          </div>
          
          {/* Category selector (desktop) */}
          <div className="hidden md:flex space-x-2">
            <div className="relative inline-block">
              <button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="flex items-center py-2 px-4 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50"
              >
                <Filter size={18} className="mr-2" />
                {selectedCategory ? `Category: ${selectedCategory}` : 'Filter by category'}
              </button>
              
              {isFiltersOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                >
                  <div className="p-2">
                    <button
                      onClick={() => handleCategoryChange(null)}
                      className={`w-full text-left px-4 py-2 rounded-md ${selectedCategory === null ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-100'}`}
                    >
                      All Categories
                    </button>
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => handleCategoryChange(category)}
                        className={`w-full text-left px-4 py-2 rounded-md ${selectedCategory === category ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-100'}`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
            
            {(searchQuery || selectedCategory) && (
              <button
                onClick={clearFilters}
                className="py-2 px-4 text-blue-700 hover:text-blue-900"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile filters dropdown */}
      {isFiltersOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden mb-6 bg-white border border-gray-200 rounded-lg overflow-hidden"
        >
          <div className="p-4">
            <h3 className="font-medium mb-2">Filter by Category</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleCategoryChange(null)}
                className={`w-full text-left px-3 py-2 rounded-md ${selectedCategory === null ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-100'}`}
              >
                All Categories
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`w-full text-left px-3 py-2 rounded-md ${selectedCategory === category ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-100'}`}
                >
                  {category}
                </button>
              ))}
            </div>
            
            {(searchQuery || selectedCategory) && (
              <button
                onClick={clearFilters}
                className="mt-4 w-full py-2 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50"
              >
                Clear all filters
              </button>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Filter indicators */}
      {(searchQuery || selectedCategory) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {searchQuery && (
            <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-sm">
              Search: {searchQuery}
              <button onClick={() => setSearchQuery('')} className="ml-2 text-blue-600 hover:text-blue-800">
                <X size={14} />
              </button>
            </span>
          )}
          
          {selectedCategory && (
            <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-sm">
              Category: {selectedCategory}
              <button onClick={() => setSelectedCategory(null)} className="ml-2 text-blue-600 hover:text-blue-800">
                <X size={14} />
              </button>
            </span>
          )}
        </div>
      )}
      
      {/* Products display */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No products found matching your criteria.</p>
          <button
            onClick={clearFilters}
            className="mt-4 text-blue-700 hover:text-blue-900"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {/* Results count */}
          <p className="text-sm text-gray-500 mb-6">
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            {(searchQuery || selectedCategory) && products.length !== filteredProducts.length && 
              ` of ${products.length} total`}
          </p>

          {/* Products grid with animation */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {filteredProducts.map((product, index) => (
              <motion.div 
                key={product.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                transition={{ duration: 0.3 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </div>
  )
}