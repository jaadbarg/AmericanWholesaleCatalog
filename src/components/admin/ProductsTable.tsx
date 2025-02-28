'use client'

import React, { useState, useEffect } from 'react'
import { Product } from '@/lib/supabase/client'
import { Search, Filter, Edit, Trash, Check, X, MoreHorizontal, ArrowUp, ArrowDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface ProductsTableProps {
  initialProducts: Product[]
}

export default function ProductsTable({ initialProducts }: ProductsTableProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts)
  const [searchTerm, setSearchTerm] = useState('')
  // Removed category filter
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteWarningStage, setDeleteWarningStage] = useState(0)
  const [deleteProgress, setDeleteProgress] = useState(0)
  const [sortField, setSortField] = useState<keyof Product>('item_number')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Filter products when search changes
  useEffect(() => {
    let result = [...products]
    
    // Apply search filter
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase()
      result = result.filter(product => 
        product.item_number.toLowerCase().includes(lowercaseSearch) ||
        product.description.toLowerCase().includes(lowercaseSearch)
      )
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const valueA = a[sortField] || ''
      const valueB = b[sortField] || ''
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA)
      }
      
      return 0
    })
    
    setFilteredProducts(result)
    setCurrentPage(1) // Reset to first page when filters change
  }, [products, searchTerm, sortField, sortDirection])
  
  // Handle bulk selection
  const toggleSelectAll = () => {
    if (selectedProducts.size === currentPageProducts.length) {
      // Deselect all currently visible products
      const newSelected = new Set(selectedProducts)
      currentPageProducts.forEach(product => {
        newSelected.delete(product.id)
      })
      setSelectedProducts(newSelected)
    } else {
      // Select all currently visible products
      const newSelected = new Set(selectedProducts)
      currentPageProducts.forEach(product => {
        newSelected.add(product.id)
      })
      setSelectedProducts(newSelected)
    }
  }
  
  // Handle individual selection
  const toggleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }
  
  // Handle sort change
  const handleSort = (field: keyof Product) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }
  
  // Handle delete selected products
  const handleDeleteSelected = async () => {
    if (selectedProducts.size === 0) return
    
    // Check the confirmation text
    const requiredText = `DELETE ${selectedProducts.size} PRODUCTS`;
    if (deleteConfirmText !== requiredText) {
      alert('Please type the confirmation text exactly as shown to proceed with deletion.');
      return;
    }
    
    setIsDeleting(true)
    
    try {
      const productsToDelete = Array.from(selectedProducts)
      
      // Get list of products that are in use
      const { data: usedProducts, error: checkError } = await supabase
        .from('customer_products')
        .select('product_id')
        .in('product_id', productsToDelete)
      
      if (checkError) {
        throw new Error(`Error checking product usage: ${checkError.message}`)
      }
      
      // Create sets for easy lookup
      const usedProductIds = new Set(usedProducts?.map(p => p.product_id) || [])
      
      // Separate products that can be deleted from those that cannot
      const safeToDeleteIds = productsToDelete.filter(id => !usedProductIds.has(id))
      const totalUsedProducts = usedProductIds.size
      
      if (totalUsedProducts > 0) {
        alert(`⚠️ Cannot delete ${totalUsedProducts} products because they are assigned to customers. Remove product assignments first.`)
        
        if (safeToDeleteIds.length === 0) {
          setIsDeleting(false)
          setShowDeleteConfirm(false)
          setDeleteWarningStage(0)
          return
        }
        
        // Ask for confirmation to proceed with partial deletion
        const confirmPartial = window.confirm(
          `${totalUsedProducts} products are assigned to customers and cannot be deleted.\n\n` +
          `Do you want to proceed with deleting the remaining ${safeToDeleteIds.length} products?`
        )
        
        if (!confirmPartial) {
          setIsDeleting(false)
          setShowDeleteConfirm(false)
          setDeleteWarningStage(0)
          return
        }
        
        // Delete each product individually using the admin function
        let successCount = 0;
        let failCount = 0;
        
        for (const id of safeToDeleteIds) {
          const { error } = await supabase.rpc('admin_delete_product', {
            product_id_param: id
          });
          
          if (error) {
            console.error(`Failed to delete product ${id}:`, error);
            failCount++;
          } else {
            successCount++;
          }
        }
        
        // Update local state
        if (successCount > 0) {
          setProducts(products.filter(p => !safeToDeleteIds.includes(p.id) || failCount > 0))
          setSelectedProducts(new Set())
        }
        
        alert(`✅ ${successCount} products deleted successfully.\n\n` + 
              (failCount > 0 ? `❌ ${failCount} products failed to delete.\n\n` : '') +
              `⚠️ ${totalUsedProducts} products were NOT deleted because they are assigned to customers.`)
      } else {
        // One last chance to back out
        const finalConfirmation = window.confirm(
          `⚠️ FINAL WARNING ⚠️\n\n` +
          `You are about to permanently delete ${productsToDelete.length} products. This action cannot be undone.\n\n` +
          `Are you absolutely sure you want to proceed?`
        )
        
        if (!finalConfirmation) {
          setIsDeleting(false)
          setShowDeleteConfirm(false)
          setDeleteWarningStage(0)
          return
        }
        
        // Delete each product individually using the admin function
        let successCount = 0;
        let failCount = 0;
        
        for (const id of productsToDelete) {
          const { error } = await supabase.rpc('admin_delete_product', {
            product_id_param: id
          });
          
          if (error) {
            console.error(`Failed to delete product ${id}:`, error);
            failCount++;
          } else {
            successCount++;
          }
        }
        
        // Update local state
        if (successCount > 0) {
          setProducts(products.filter(p => {
            const wasSuccessful = !selectedProducts.has(p.id) || failCount > 0;
            return wasSuccessful;
          }));
          setSelectedProducts(new Set());
        }
        
        alert(`✅ ${successCount} products deleted successfully.` + 
              (failCount > 0 ? `\n\n❌ ${failCount} products failed to delete.` : ''))
      }
    } catch (error) {
      console.error('Error during product deletion:', error)
      alert('❌ An error occurred while deleting products. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setDeleteWarningStage(0)
      router.refresh()
    }
  }
  
  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPageProducts = filteredProducts.slice(startIndex, endIndex)
  
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }
  
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Table Header with Search and Filter */}
      <div className="p-6 border-b">
        <div className="flex flex-col md:flex-row justify-between gap-4">
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
          
          {/* Category filter removed */}
        </div>
      </div>
      
      {/* Bulk Actions */}
      {selectedProducts.size > 0 && (
        <div className="p-3 bg-blue-50 border-b flex justify-between items-center">
          <div className="text-sm">
            <span className="font-medium text-blue-700">{selectedProducts.size}</span>
            <span className="text-blue-600"> products selected</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedProducts(new Set())}
              className="px-3 py-1 text-xs font-medium text-gray-700 hover:text-gray-900"
            >
              Clear
            </button>
            <button
              onClick={() => {
                if (deleteWarningStage === 0) {
                  setDeleteWarningStage(1);
                } else if (deleteWarningStage === 1) {
                  setDeleteWarningStage(2);
                } else {
                  setShowDeleteConfirm(true);
                  setDeleteConfirmText('');
                  setDeleteProgress(0);
                }
              }}
              className={`flex items-center px-3 py-1 text-xs font-medium ${
                deleteWarningStage === 0 
                  ? 'text-red-700 hover:text-red-800' 
                  : deleteWarningStage === 1
                    ? 'bg-red-100 text-red-800 font-bold' 
                    : 'bg-red-200 text-red-900 font-bold animate-pulse'
              }`}
            >
              <Trash className="h-3 w-3 mr-1" />
              {deleteWarningStage === 0 
                ? 'Delete Selected' 
                : deleteWarningStage === 1 
                  ? 'Are you sure? Click again!' 
                  : 'FINAL WARNING!'}
            </button>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">⚠️ Final Confirmation Required</h3>
            
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    DANGER ZONE: Product Deletion
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      You are about to permanently delete {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''}.
                      This action is <span className="font-bold underline">irreversible</span> and may affect:
                    </p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Customer product catalogs</li>
                      <li>Historical order data</li>
                      <li>System integrity</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To confirm deletion, type: <span className="font-mono bg-red-100 text-red-800 px-1 py-0.5">DELETE {selectedProducts.size} PRODUCTS</span>
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => {
                  setDeleteConfirmText(e.target.value);
                  setDeleteProgress(Math.min(100, Math.round((e.target.value.length / `DELETE ${selectedProducts.size} PRODUCTS`.length) * 100)));
                }}
                className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 font-mono bg-white"
                placeholder={`Type "DELETE ${selectedProducts.size} PRODUCTS" here`}
              />
              
              <div className="mt-3 w-full bg-red-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${deleteProgress < 100 ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${deleteProgress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteWarningStage(0);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleDeleteSelected}
                className={`flex items-center px-4 py-2 ${
                  deleteConfirmText === `DELETE ${selectedProducts.size} PRODUCTS` && !isDeleting
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } rounded-md transition-colors`}
                disabled={deleteConfirmText !== `DELETE ${selectedProducts.size} PRODUCTS` || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash className="h-4 w-4 mr-1" />
                    Permanently Delete Products
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Products Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="py-3 px-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={currentPageProducts.length > 0 && selectedProducts.size >= currentPageProducts.length && 
                              currentPageProducts.every(p => selectedProducts.has(p.id))}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </th>
              <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">
                <button 
                  className="flex items-center font-medium"
                  onClick={() => handleSort('item_number')}
                >
                  ITEM NUMBER
                  {sortField === 'item_number' && (
                    sortDirection === 'asc' ? 
                      <ArrowUp className="h-3 w-3 ml-1" /> : 
                      <ArrowDown className="h-3 w-3 ml-1" />
                  )}
                </button>
              </th>
              <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">
                <button 
                  className="flex items-center font-medium"
                  onClick={() => handleSort('description')}
                >
                  DESCRIPTION
                  {sortField === 'description' && (
                    sortDirection === 'asc' ? 
                      <ArrowUp className="h-3 w-3 ml-1" /> : 
                      <ArrowDown className="h-3 w-3 ml-1" />
                  )}
                </button>
              </th>
              {/* Category column header removed */}
              <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {currentPageProducts.map((product) => (
              <tr key={product.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.id)}
                    onChange={() => toggleSelectProduct(product.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="py-3 px-4 font-medium">{product.item_number}</td>
                <td className="py-3 px-4 text-gray-600 truncate max-w-xs">{product.description}</td>
                {/* Category column removed */}
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/products/${encodeURIComponent(product.id)}/edit`}
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => {
                        setSelectedProducts(new Set([product.id]));
                        if (deleteWarningStage === 0) {
                          setDeleteWarningStage(1);
                        } else if (deleteWarningStage === 1) {
                          setDeleteWarningStage(2);
                        } else {
                          setShowDeleteConfirm(true);
                          setDeleteConfirmText('');
                          setDeleteProgress(0);
                        }
                      }}
                      className={`p-1.5 rounded-md ${
                        deleteWarningStage === 0 
                          ? 'text-red-600 hover:text-red-800 hover:bg-red-50' 
                          : deleteWarningStage === 1
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-red-200 text-red-900 animate-pulse'
                      }`}
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            
            {currentPageProducts.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-500">
                  {filteredProducts.length === 0 ? (
                    searchTerm || categoryFilter !== 'all' ? (
                      <div className="flex flex-col items-center">
                        <p className="mb-2">No products match your search criteria</p>
                        <button
                          onClick={() => {
                            setSearchTerm('')
                            setCategoryFilter('all')
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Clear filters
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <p className="mb-2">No products available</p>
                        <Link
                          href="/admin/products/new"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Add your first product
                        </Link>
                      </div>
                    )
                  ) : (
                    'No products to display'
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {filteredProducts.length > 0 && (
        <div className="p-4 border-t flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-700">
            <span className="hidden md:inline-block">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, filteredProducts.length)}</span> of{' '}
              <span className="font-medium">{filteredProducts.length}</span> products
            </span>
            <span className="inline-block md:hidden">
              {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              className="py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
            >
              {[10, 25, 50, 100].map(value => (
                <option key={value} value={value}>
                  {value} / page
                </option>
              ))}
            </select>
            
            <nav className="flex items-center space-x-1">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-1 rounded-md ${
                  currentPage === 1 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Page numbers - show 3 pages before and after current page */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1 || totalPages <= 5)
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-1 text-gray-500">...</span>
                    )}
                    <button
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-1 rounded-md ${
                  currentPage === totalPages 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}