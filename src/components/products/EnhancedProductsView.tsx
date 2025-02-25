// src/components/products/EnhancedProductsView.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, X, ChevronDown, LayoutGrid, LayoutList } from 'lucide-react'
import { EnhancedProductCard } from './EnhancedProductCard'
import { SkeletonCard } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
  
  return Array.from(new Set(categories)).sort()
}

export function EnhancedProductsView({ products }: { products: Product[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
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
      {/* Header with title, search, and filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-4 md:mb-0">
          Your Products
        </h1>
        
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <Input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search products..."
              className="w-full md:w-64"
              icon={<Search className="h-4 w-4" />}
            />
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
            <Button
              variant="outline"
              fullWidth
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              icon={<Filter size={16} />}
            >
              {selectedCategory ? `Category: ${selectedCategory}` : 'Filter by category'}
            </Button>
          </div>
          
          {/* Desktop filter dropdown and view mode toggle */}
          <div className="hidden md:flex space-x-2">
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="flex items-center"
                icon={<Filter size={16} />}
              >
                {selectedCategory ? `${selectedCategory}` : 'All Categories'}
                <ChevronDown size={16} className="ml-2" />
              </Button>
              
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
              <Button
                variant="ghost"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            )}
            
            {/* View mode toggle */}
            <div className="flex items-center border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-100'}`}
                title="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-100'}`}
                title="List view"
              >
                <LayoutList size={16} />
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
                    className={`flex-1 p-2 flex items-center justify-center ${viewMode === 'grid' ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-100'}`}
                  >
                    <LayoutGrid size={16} className="mr-2" />
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 p-2 flex items-center justify-center ${viewMode === 'list' ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-100'}`}
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