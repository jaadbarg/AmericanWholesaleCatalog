// src/components/products/EnhancedProductsView.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, X, ChevronDown, LayoutGrid, LayoutList, ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { EnhancedProductCard } from './EnhancedProductCard'
import { SkeletonCard } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/useCart'

// Define the product type
type Product = {
  id: string
  item_number: string
  description: string
  category: string | null
  customerNote: string
  customerId: string
}

// Helper function to sort products by item_number
function sortProducts(products: Product[]) {
  return products.sort((a, b) => {
    // Extract the alphabetic prefix and numeric parts from item_number
    const aMatch = a.item_number.match(/^([A-Za-z]+)(\d+)/)
    const bMatch = b.item_number.match(/^([A-Za-z]+)(\d+)/)
    
    if (!aMatch || !bMatch) {
      // If either doesn't match the pattern, fall back to simple string comparison
      return a.item_number.localeCompare(b.item_number)
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
  
  return Array.from(new Set(categories)).sort()
}

export function EnhancedProductsView({ products }: { products: Product[] }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilterMessage, setShowFilterMessage] = useState(false)
  
  // Get cart data from the cart hook
  const cart = useCart()
  
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
  
  // Handle specific "All Products" button click with visual feedback
  const handleAllProductsClick = () => {
    // If a category was selected, clear it
    if (selectedCategory !== null) {
      setSelectedCategory(null)
    } else if (categories.length > 0) {
      // Only show message if there are categories available but none selected
      setShowFilterMessage(true)
      setTimeout(() => {
        setShowFilterMessage(false)
      }, 2000)
    }
    // If no categories exist, don't show any message
  }

  // Container variants for animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  // Item variants for animation
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  // Skeleton loader for product cards
  const ProductsSkeleton = () => (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`}>
      {Array.from({ length: 9 }).map((_, index) => (
        <SkeletonCard key={index} hasImage={false} />
      ))}
    </div>
  );

  return (
    <div>
      {/* Header with title and cart access for quick checkout */}
      <div className="bg-gradient-to-r from-american-navy-600 to-american-navy-800 p-6 rounded-xl border border-american-navy-400 mb-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-white p-3 rounded-full mr-3 shadow-sm">
              <ShoppingCart className="h-6 w-6 text-american-navy-700" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Product Catalog
            </h1>
          </div>
          
          <div className="flex items-center bg-white px-4 py-3 rounded-lg border border-american-navy-200 shadow-sm">
            <ShoppingCart className="h-5 w-5 text-american-navy-600 mr-2" />
            <span className="text-gray-800 font-medium">
              {cart.items.length > 0 ? (
                <>
                  <span className="font-bold">{cart.items.reduce((total, item) => total + item.quantity, 0)}</span> items in cart
                </>
              ) : "Your cart is empty"}
            </span>
            {cart.items.length > 0 ? (
              <Button
                variant="primary"
                size="sm"
                className="ml-3"
                onClick={() => router.push('/cart')}
              >
                View Cart
              </Button>
            ) : (
              <span className="ml-3 text-sm text-gray-600">Add products below to start your order</span>
            )}
          </div>
        </div>
        
        <p className="text-white/80 mt-3 max-w-2xl">
          Browse your custom catalog and add items to your cart to place an order. Your personalized product selection is shown below.
        </p>
      </div>
      
      {/* Feedback message when clicking "All Products" while already showing all products */}
      <AnimatePresence>
        {showFilterMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-american-navy-50 text-american-navy-800 px-4 py-2 rounded-md mb-3 flex items-center border border-american-navy-100"
          >
            <Filter className="h-4 w-4 mr-2" />
            <span>All products are already being shown. No category filter is active.</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* User-friendly search and category navigation */}
      <div className="bg-white rounded-lg border-2 border-american-navy-200 p-5 mb-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Larger, more obvious search with helpful placeholder */}
          <div className="relative flex-grow">
            <Input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by product number or description..."
              className="w-full text-lg py-3 pl-12 pr-4 border-american-navy-200 focus:border-american-navy-400 focus:ring-american-navy-400"
              icon={<Search className="h-6 w-6 text-american-navy-500 absolute left-4 top-1/2 transform -translate-y-1/2" />}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-american-navy-400 hover:text-american-navy-600 bg-american-navy-50 rounded-full p-1"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>
          
          {/* Desktop filter buttons - larger and more intuitive */}
          <div className="hidden md:flex md:flex-wrap gap-2">
            {categories.length > 0 && (
              <Button
                variant={selectedCategory === null ? "primary" : "outline"}
                onClick={handleAllProductsClick}
                className="px-4 py-2 text-base"
                aria-pressed={selectedCategory === null}
                title="Show all products without category filter"
              >
                All Products {selectedCategory === null && '✓'}
              </Button>
            )}
            
            {categories.slice(0, 5).map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "primary" : "outline"}
                onClick={() => handleCategoryChange(category)}
                className="px-4 py-2 text-base"
              >
                {category}
              </Button>
            ))}
            
            {categories.length > 5 && (
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  className="px-4 py-2 text-base"
                >
                  More Categories
                  <ChevronDown size={18} className="ml-2" />
                </Button>
                
                {isFiltersOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                  >
                    <div className="p-2 max-h-96 overflow-y-auto">
                      {categories.slice(5).map(category => (
                        <button
                          key={category}
                          onClick={() => handleCategoryChange(category)}
                          className={`w-full text-left px-4 py-3 rounded-md text-base ${selectedCategory === category ? 'bg-american-navy-50 text-american-navy-800 font-medium' : 'hover:bg-gray-100'}`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
          
          {/* Mobile-friendly category select */}
          <div className="md:hidden w-full">
            <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Category:
            </label>
            <select
              id="category-select"
              value={selectedCategory || ''}
              onChange={(e) => handleCategoryChange(e.target.value === '' ? null : e.target.value)}
              className="block w-full rounded-md border border-gray-300 py-3 px-4 bg-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
              disabled={categories.length === 0}
            >
              {categories.length === 0 ? (
                <option value="">No categories available</option>
              ) : (
                <>
                  <option value="">All Products ✓</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>
        
        {/* View mode toggle with clear labels */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
          <div>
            {(searchQuery || selectedCategory) && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-american-navy-700"
                icon={<X size={16} />}
              >
                Clear All Filters
              </Button>
            )}
          </div>
          
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">View as:</span>
            <div className="flex items-center border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 flex items-center ${viewMode === 'grid' ? 'bg-american-navy-600 text-white font-medium' : 'hover:bg-american-navy-50 text-american-navy-700'}`}
                title="Grid view"
              >
                <LayoutGrid size={16} className="mr-1" />
                <span className="text-sm">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 flex items-center ${viewMode === 'list' ? 'bg-american-navy-600 text-white font-medium' : 'hover:bg-american-navy-50 text-american-navy-700'}`}
                title="List view"
              >
                <LayoutList size={16} className="mr-1" />
                <span className="text-sm">List</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile filters dropdown */}
      <AnimatePresence>
        {isFiltersOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mb-6 bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            <div className="p-4">
              <h3 className="font-medium mb-2">Filter by Category</h3>
              <div className="space-y-2">
                {categories.length > 0 ? (
                  <>
                    <button
                      onClick={handleAllProductsClick}
                      className={`w-full text-left px-3 py-2 rounded-md ${selectedCategory === null ? 'bg-american-navy-50 text-american-navy-800' : 'hover:bg-gray-100'}`}
                    >
                      All Categories {selectedCategory === null && '✓'}
                    </button>
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => handleCategoryChange(category)}
                        className={`w-full text-left px-3 py-2 rounded-md ${selectedCategory === category ? 'bg-american-navy-50 text-american-navy-800' : 'hover:bg-gray-100'}`}
                      >
                        {category}
                      </button>
                    ))}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 italic p-2">No categories available</p>
                )}
                  {/* This comment was removed to fix syntax issues */}
              </div>
              
              {(searchQuery || selectedCategory) && (
                <Button
                  variant="outline"
                  fullWidth
                  onClick={clearFilters}
                  className="mt-4"
                >
                  Clear all filters
                </Button>
              )}
              
              {/* Mobile view mode toggle */}
              <div className="mt-4">
                <h3 className="font-medium mb-2">View Mode</h3>
                <div className="flex items-center border rounded-md overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 p-2 flex items-center justify-center ${viewMode === 'grid' ? 'bg-american-navy-50 text-american-navy-800' : 'hover:bg-gray-100'}`}
                  >
                    <LayoutGrid size={16} className="mr-2" />
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 p-2 flex items-center justify-center ${viewMode === 'list' ? 'bg-american-navy-50 text-american-navy-800' : 'hover:bg-gray-100'}`}
                  >
                    <LayoutList size={16} className="mr-2" />
                    List
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Filter indicators */}
      {(searchQuery || selectedCategory) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {searchQuery && (
            <Badge 
              variant="primary" 
              rounded 
              onDismiss={() => setSearchQuery('')}
              icon={<Search size={12} />}
            >
              {searchQuery}
            </Badge>
          )}
          
          {selectedCategory && (
            <Badge 
              variant="primary" 
              rounded 
              onDismiss={() => setSelectedCategory(null)}
              icon={<Filter size={12} />}
            >
              {selectedCategory}
            </Badge>
          )}
        </div>
      )}
      
      {/* Loading state */}
      {isLoading ? (
        <ProductsSkeleton />
      ) : (
        <>
          {/* No results state */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-gray-600 mb-3">No products found matching your criteria.</p>
                <Button 
                  variant="primary"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              </motion.div>
            </div>
          ) : (
            <>
              {/* Results count */}
              <p className="text-sm text-gray-500 mb-6">
                Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                {(searchQuery || selectedCategory) && products.length !== filteredProducts.length && 
                  ` of ${products.length} total`}
              </p>

              {/* Products grid or list with animation */}
              <motion.div 
                className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "space-y-4"
                }
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredProducts.map((product) => (
                  <motion.div 
                    key={product.id}
                    variants={itemVariants}
                    layout
                    className={viewMode === 'list' ? "max-w-full" : ""}
                  >
                    <EnhancedProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
        </>
      )}
    </div>
  )
}