'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Save, CheckCircle, XCircle, Check } from 'lucide-react'
import { Product } from '@/lib/supabase/client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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
  const supabase = createClientComponentClient()
  
  // Debug log when component receives props
  console.log("CustomerProductManager - initialProducts count:", initialProducts.length);
  console.log("CustomerProductManager - initially selected products:", initialProducts.filter(p => p.selected).length);
  console.log("Initially selected product IDs:", initialProducts.filter(p => p.selected).map(p => p.id));
  
  // Initialize states
  const [products, setProducts] = useState<ExtendedProduct[]>(initialProducts)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  
  // Track which products are actually assigned in the database
  const [assignedProducts, setAssignedProducts] = useState<Set<string>>(
    new Set(initialProducts.filter(p => p.selected).map(p => p.id))
  );
  
  // Log state for debugging
  useEffect(() => {
    console.log("CURRENT PRODUCTS STATE:", products.filter(p => p.selected).length, "selected out of", products.length);
    console.log("ASSIGNED PRODUCTS STATE:", Array.from(assignedProducts).length, "products");
  }, [products, assignedProducts]);
  
  // Direct query to check customer_products table and update product selection
  useEffect(() => {
    const checkCustomerProducts = async () => {
      console.log("Directly checking customer_products table for customerId:", customerId);
      const { data, error } = await supabase
        .from('customer_products')
        .select('product_id')
        .eq('customer_id', customerId);
      
      console.log("Direct query results:", data);
      console.log("Direct query error:", error);
      console.log("Direct query product count:", data?.length || 0);
      
      if (!error) {
        // Always update, even if data is empty (which means no assigned products)
        const productIds = (data || []).map(item => item.product_id);
        console.log("Product IDs directly from database:", productIds);
        
        // Create a set of product IDs that are assigned to this customer
        const assignedProductIds = new Set(productIds);
        
        // Update our product selection state to match the database state
        setProducts(prevProducts => 
          prevProducts.map(product => ({
            ...product,
            selected: assignedProductIds.has(product.id)
          }))
        );
        
        // Update our assigned products state
        setAssignedProducts(assignedProductIds);
        
        console.log("Updated assignedProducts with", assignedProductIds.size, "products");
      }
    };
    
    checkCustomerProducts();
  }, [customerId, supabase]);
  
  // Function to derive category from item number
  const getCategoryFromItemNumber = (itemNumber: string): string => {
    // Extract the prefix (first 2 characters)
    const prefix = itemNumber.substring(0, 2).toUpperCase();
    
    // Handle special case for BASKET items
    if (itemNumber.startsWith('BASKET')) {
      return 'Baskets';
    }
    
    // Map prefixes to categories
    switch (prefix) {
      case 'AF': return 'Air Fresheners';
      case 'AL': return 'Aluminum Products';
      case 'BA': return 'Baskets';
      case 'BN': return 'Bins & Trash Containers';
      case 'BX': return 'Boxes';
      case 'CK': return 'Cake Boxes & Bakery Packaging';
      case 'CP': return 'Cups';
      case 'CS': return 'Cleaning Supplies';
      case 'CT': return 'Containers';
      case 'CU': return 'Cutlery & Utensils';
      case 'DI': return 'Discounts';
      case 'DS': return 'Dispensers';
      case 'GL': return 'Gloves';
      case 'JA': return 'Janitorial Supplies';
      case 'JU': return 'Jugs & Mason Jars';
      case 'LN': return 'Pan Liners';
      case 'P0': return 'Paper Products';
      case 'PB': return 'Paper Bags';
      case 'PL': return 'Plates & Platters';
      case 'PZ': return 'Pizza Supplies';
      case 'ST': return 'Straws & Stirrers';
      case 'TB': return 'Trash Bags';
      case 'TR': return 'Trays';
      case 'UT': return 'Utility Products';
      case 'WP': return 'Wipes';
      case 'WR': return 'Wraps & Films';
      case 'WX': return 'Wax Paper Products';
      default: return 'Miscellaneous';
    }
  };
  
  // Derive categories from item numbers instead of DB categories
  const categories = ['all', ...Array.from(new Set(
    initialProducts.map(p => getCategoryFromItemNumber(p.item_number))
  ))].sort()

  // Filter products based on search, category, and special filters
  const filteredProducts = products.filter(product => {
    // First apply text search filter
    const matchesSearch = product.item_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Apply special filters
    if (categoryFilter === '__assigned__') {
      // Show only assigned products
      return matchesSearch && product.selected;
    } else if (categoryFilter === '__unassigned__') {
      // Show only unassigned products
      return matchesSearch && !product.selected;
    } else if (categoryFilter === '__changes__') {
      // Show only products with pending changes
      const hasChanged = (product.selected && !assignedProducts.has(product.id)) || 
                         (!product.selected && assignedProducts.has(product.id));
      return matchesSearch && hasChanged;
    }
    
    // Then apply derived category filter
    const derivedCategory = getCategoryFromItemNumber(product.item_number);
    const matchesCategory = categoryFilter === 'all' || derivedCategory === categoryFilter;
    
    return matchesSearch && matchesCategory;
  })

  // Stats
  const totalProducts = products.length
  const selectedProducts = products.filter(p => p.selected).length
  
  // Get current selection
  const currentSelectedIds = new Set(products.filter(p => p.selected).map(p => p.id))
  
  // Products to add (in current selection but not in assigned products)
  const productsToAdd = products.filter(p => p.selected && !assignedProducts.has(p.id))
  
  // Products to remove (in assigned products but not in current selection)
  const productsToRemove = products.filter(p => !p.selected && assignedProducts.has(p.id))
  
  // Count changes
  const changesCount = productsToAdd.length + productsToRemove.length

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
        getCategoryFromItemNumber(p.item_number) === category ? { ...p, selected: true } : p
      )
    )
  }

  // Handle saving changes
  const saveChanges = async () => {
    setSaving(true)
    setSaveSuccess(false)
    setSaveError('')
    
    try {
      // Products to add - products that are now selected but weren't initially
      const toAdd = productsToAdd.map(p => p.id)
      
      // Products to remove - products that were initially selected but now aren't
      const toRemove = productsToRemove.map(p => p.id)
      
      // Make API calls to update
      console.log("Saving changes - products to add:", toAdd.length, toAdd);
      console.log("Saving changes - products to remove:", toRemove.length, toRemove);
      
      // Process additions first
      if (toAdd.length > 0) {
        console.log("Adding products with customerId:", customerId);
        // Import the function dynamically to ensure we get the latest version
        const { addProductsToCustomer } = await import('@/lib/supabase/client');
        
        const result = await addProductsToCustomer(customerId, toAdd);
        console.log("Add products result:", result);
        
        if (!result.success) {
          throw new Error(result.message || 'Failed to add products')
        }
      }
      
      // Then process removals
      if (toRemove.length > 0) {
        console.log("Removing products with customerId:", customerId);
        // Import the function dynamically to ensure we get the latest version
        const { removeProductsFromCustomer } = await import('@/lib/supabase/client');
        
        const result = await removeProductsFromCustomer(customerId, toRemove);
        console.log("Remove products result:", result);
        
        if (!result.success) {
          throw new Error(result.message || 'Failed to remove products')
        }
      }
      
      // Update UI state
      setSaveSuccess(true)
      
      // After successful save, update our assignedProducts state to match current selection
      // This effectively clears the changes since current == assigned
      const selectedProductIds = products.filter(p => p.selected).map(p => p.id);
      setAssignedProducts(new Set(selectedProductIds));
      
      // Force update of the products state to trigger re-render
      setProducts([...products]);
      
      // Log the new selection state for debugging
      console.log("Updated selection after save:", selectedProductIds);
      
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
        </div>
        
        {/* Stats bar */}
        <div className="px-6 py-3 bg-gray-50 border-t border-b flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="text-sm text-gray-500 flex flex-wrap items-center gap-2">
            <div>
              Showing {filteredProducts.length} of {totalProducts} products.
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-blue-600 flex items-center">
                {selectedProducts} product(s) selected for customer
              </span>
              
              {changesCount > 0 && (
                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                  {changesCount} changes to save
                </span>
              )}
            </div>
            
            {productsToAdd.length > 0 && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                {productsToAdd.length} to add
              </span>
            )}
            
            {productsToRemove.length > 0 && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                {productsToRemove.length} to remove
              </span>
            )}
          </div>
          
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              saving 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : changesCount > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse'
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
                <span>Save {changesCount > 0 ? `${changesCount} Changes` : 'Changes'}</span>
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
        
        {/* View toggle */}
        <div className="flex items-center justify-center py-2 bg-gray-100 border-t border-b">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-4 py-2 text-sm font-medium ${
                categoryFilter === 'all' 
                  ? 'bg-white text-gray-700 border border-gray-200 rounded-l-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 rounded-l-lg'
              }`}
            >
              All Products
            </button>
            
            <button
              type="button"
              onClick={() => {
                // Create a virtual "Assigned" filter
                setSearchTerm("")
                setCategoryFilter('__assigned__')
              }}
              className={`px-4 py-2 text-sm font-medium ${
                categoryFilter === '__assigned__' 
                  ? 'bg-white text-gray-700 border-t border-b border-r border-gray-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-t border-b border-r border-gray-200'
              }`}
            >
              Assigned Only
            </button>
            
            <button
              type="button"
              onClick={() => {
                // Create a virtual "Unassigned" filter
                setSearchTerm("")
                setCategoryFilter('__unassigned__')
              }}
              className={`px-4 py-2 text-sm font-medium ${
                categoryFilter === '__unassigned__' 
                  ? 'bg-white text-gray-700 border-t border-b border-r border-gray-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-t border-b border-r border-gray-200'
              }`}
            >
              Unassigned Only
            </button>
            
            <button
              type="button"
              onClick={() => {
                // Create a virtual "Changes" filter to show only products with pending changes
                setSearchTerm("")
                setCategoryFilter('__changes__')
              }}
              className={`px-4 py-2 text-sm font-medium ${
                categoryFilter === '__changes__' 
                  ? 'bg-white text-gray-700 border border-gray-200 rounded-r-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 rounded-r-lg'
              }`}
            >
              Changes Only
            </button>
          </div>
        </div>

        {/* Products grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => {
              // Determine product status for styling
              const wasInitiallySelected = assignedProducts.has(product.id);
              const isNowSelected = product.selected;
              
              // Status determination
              const isBeingAdded = !wasInitiallySelected && isNowSelected;
              const isBeingRemoved = wasInitiallySelected && !isNowSelected;
              const isUnchanged = (wasInitiallySelected && isNowSelected) || (!wasInitiallySelected && !isNowSelected);
              
              return (
                <div 
                  key={product.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isBeingAdded 
                      ? 'border-green-500 bg-green-50 shadow-md' 
                      : isBeingRemoved
                        ? 'border-red-500 bg-red-50 shadow-md' 
                        : isNowSelected
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleProduct(product.id)}
                >
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="font-medium">{product.item_number}</div>
                        {isBeingAdded && (
                          <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded">+ Adding</span>
                        )}
                        {isBeingRemoved && (
                          <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded">− Removing</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{product.description}</div>
                      <div className="flex items-center mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {getCategoryFromItemNumber(product.item_number)}
                        </span>
                        {assignedProducts.has(product.id) && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Currently Assigned
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className={`ml-3 ${
                      isBeingAdded
                        ? 'bg-green-500 text-white shadow-sm'
                        : isBeingRemoved
                          ? 'bg-red-500 text-white shadow-sm'
                          : isNowSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                    } p-2 rounded-full`}>
                      <Check className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-8 text-center text-gray-500">
              {categoryFilter === '__assigned__' ? (
                <div>
                  <p className="mb-2">This customer doesn't have any products assigned yet.</p>
                  <button 
                    onClick={() => setCategoryFilter('all')}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    View all products
                  </button>
                </div>
              ) : categoryFilter === '__unassigned__' ? (
                <div>
                  <p className="mb-2">All products have already been assigned to this customer.</p>
                  <button 
                    onClick={() => setCategoryFilter('all')}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    View all products
                  </button>
                </div>
              ) : categoryFilter === '__changes__' ? (
                <div>
                  <p className="mb-2">No pending changes to product assignments.</p>
                  <button 
                    onClick={() => setCategoryFilter('all')}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    View all products
                  </button>
                </div>
              ) : (
                <div>
                  <p>No products match your search criteria</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}