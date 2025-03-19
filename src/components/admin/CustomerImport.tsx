'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Product } from '@/lib/supabase/client'
import { Upload, CheckCircle, XCircle, AlertTriangle, FileText, Info } from 'lucide-react'

interface CustomerImportProps {
  products: Product[]
}

interface ImportRow {
  name: string
  email: string
  productIds: string[]
  invalidProducts: string[]
  status: 'pending' | 'success' | 'error'
  message?: string
}

export default function CustomerImport({ products }: CustomerImportProps) {
  const router = useRouter()
  const [csvContent, setCsvContent] = useState('')
  const [fileUploaded, setFileUploaded] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importRows, setImportRows] = useState<ImportRow[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [importComplete, setImportComplete] = useState(false)
  const [importStats, setImportStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    skippedProducts: 0
  })
  const [showProductsModal, setShowProductsModal] = useState<{rowIndex: number, products: Array<{id: string, item_number: string, description: string}>} | null>(null)

  // Product ID lookup by item number
  const productLookup = products.reduce((acc, product) => {
    acc[product.item_number] = product.id
    return acc
  }, {} as Record<string, string>)
  
  // Helper function to get product details by IDs
  const getProductDetailsByIds = (productIds: string[]) => {
    return productIds.map(id => {
      const product = products.find(p => p.id === id)
      return product || { id, item_number: "Unknown", description: "Product not found" }
    })
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setCsvContent(content)
      setFileUploaded(true)
      validateCsv(content)
    }
    reader.readAsText(file)
  }

  // Validate CSV content
  const validateCsv = (content: string) => {
    setIsValidating(true)
    
    // Parse CSV
    const lines = content.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    // Check required headers
    const nameIndex = headers.indexOf('name')
    const emailIndex = headers.indexOf('email')
    const productIndex = headers.indexOf('products')
    
    if (nameIndex === -1 || emailIndex === -1) {
      alert('CSV file must contain "name" and "email" columns')
      setIsValidating(false)
      return
    }

    // Parse rows
    const rows: ImportRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      
      if (values.length < Math.max(nameIndex, emailIndex) + 1) {
        continue // Skip invalid rows
      }
      
      const name = values[nameIndex]
      const email = values[emailIndex]
      let productIds: string[] = []
      
      // Parse products if column exists
      let invalidProducts: string[] = [];
      if (productIndex !== -1 && values[productIndex]) {
        const productItems = values[productIndex].split(';').map(p => p.trim())
        
        // Track both valid and invalid products
        invalidProducts = [];
        const validProductIds: string[] = [];
        
        productItems.forEach(item => {
          const productId = productLookup[item];
          if (productId) {
            validProductIds.push(productId);
          } else if (item) { // Only track non-empty strings
            invalidProducts.push(item);
          }
        });
        
        productIds = validProductIds;
      }
      
      rows.push({
        name,
        email,
        productIds,
        invalidProducts,
        status: 'pending'
      })
    }
    
    setImportRows(rows)
    setShowPreview(true)
    setIsValidating(false)
  }

  // Start import process
  const startImport = async () => {
    if (importRows.length === 0) return
    
    setIsImporting(true)
    const updatedRows = [...importRows]
    let successCount = 0
    let failedCount = 0
    
    for (let i = 0; i < updatedRows.length; i++) {
      const row = updatedRows[i]
      
      try {
        // Call the API endpoint instead of direct function
        const response = await fetch('/api/admin/import-customer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'test-api-key'}`
          },
          body: JSON.stringify({
            customerData: { name: row.name, email: row.email },
            productIds: row.productIds
          })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          updatedRows[i] = {
            ...row,
            status: 'success',
            message: 'Customer created successfully'
          }
          successCount++
        } else {
          updatedRows[i] = {
            ...row,
            status: 'error',
            message: result.message || 'Import failed'
          }
          failedCount++
        }
      } catch (error) {
        updatedRows[i] = {
          ...row,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
        failedCount++
      }
      
      // Update state after each customer
      setImportRows([...updatedRows])
    }
    
    // Calculate total skipped products
    const skippedProductsCount = updatedRows.reduce((total, row) => 
      total + row.invalidProducts.length, 0);
    
    setImportStats({
      total: updatedRows.length,
      success: successCount,
      failed: failedCount,
      skippedProducts: skippedProductsCount
    })
    
    setImportComplete(true)
    setIsImporting(false)
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {showProductsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col">
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Products for Customer: {importRows[showProductsModal.rowIndex]?.name}
              </h3>
              <button 
                onClick={() => setShowProductsModal(null)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-1 overflow-y-auto">
              <div className="p-0.5">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {showProductsModal.products.map((product, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{product.item_number}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{product.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{(product as any).category || 'N/A'}</td>
                      </tr>
                    ))}
                    {showProductsModal.products.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500 text-sm">
                          No products assigned to this customer.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="px-5 py-4 border-t text-right">
              <button
                onClick={() => setShowProductsModal(null)}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold mb-2">Bulk Import Customers</h2>
        <p className="text-gray-500">
          Upload a CSV file to import multiple customers at once. You can also assign products during import.
        </p>
      </div>
      
      <div className="p-6">
        {!fileUploaded && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Upload your CSV file</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              The file should include columns for customer name, email, and optional product item numbers (separated by semicolons).
            </p>
            
            <div className="bg-gray-50 p-6 rounded-md text-left mb-6 max-w-lg mx-auto border border-gray-200">
              <div className="flex items-start mb-4">
                <FileText className="h-5 w-5 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-800 text-base">CSV Format Example</h4>
                  <p className="text-sm text-gray-600 mt-1 mb-3">
                    Your CSV file should include the following columns:
                  </p>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <span className="text-xs font-semibold text-blue-600 block mb-1">REQUIRED</span>
                      <span className="font-medium block mb-1">name</span>
                      <span className="text-xs text-gray-500">Customer's full name</span>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <span className="text-xs font-semibold text-blue-600 block mb-1">REQUIRED</span>
                      <span className="font-medium block mb-1">email</span>
                      <span className="text-xs text-gray-500">Valid email address</span>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <span className="text-xs font-semibold text-gray-500 block mb-1">OPTIONAL</span>
                      <span className="font-medium block mb-1">products</span>
                      <span className="text-xs text-gray-500">Product item numbers separated by semicolons. Must match existing item numbers exactly.</span>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-100 mt-4 mb-4">
                    <div className="flex">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 flex-shrink-0 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="text-xs text-yellow-800">
                        <strong>Product Item Numbers:</strong> These must match exactly with the item numbers in your product catalog. You can view all product item numbers in the Products section of the admin panel.
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-700 text-sm mb-2">Example CSV Contents:</h5>
                    <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto whitespace-pre-wrap">
                      name,email,products<br/>
                      John Smith,john@example.com,{products.length > 0 ? products[0].item_number : "ABC123"};{products.length > 1 ? products[1].item_number : "DEF456"}<br/>
                      Jane Doe,jane@example.com,{products.length > 2 ? products[2].item_number : "GHI789"}<br/>
                      Bob Johnson,bob@example.com,<br/>
                      Sarah Wilson,sarah@example.com,{products.length > 0 ? products[0].item_number : "ABC123"}
                    </pre>
                  </div>
                  
                  <div>
                    <a 
                      href={`data:text/csv;charset=utf-8,name,email,products%0AJohn%20Smith,john@example.com,${
                        encodeURIComponent((products.length > 0 ? products[0].item_number : "ABC123") + ";" + (products.length > 1 ? products[1].item_number : "DEF456"))
                      }%0AJane%20Doe,jane@example.com,${
                        encodeURIComponent(products.length > 2 ? products[2].item_number : "GHI789")
                      }%0ABob%20Johnson,bob@example.com,%0ASarah%20Wilson,sarah@example.com,${
                        encodeURIComponent(products.length > 0 ? products[0].item_number : "ABC123")
                      }`}
                      download="customer_import_template.csv"
                      className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Template
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            <input
              type="file"
              accept=".csv"
              id="csvUpload"
              className="hidden"
              onChange={handleFileUpload}
            />
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <label
                htmlFor="csvUpload"
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors"
              >
                <Upload className="mr-2 h-5 w-5" />
                Select CSV File
              </label>
              <button
                type="button"
                onClick={() => {
                  // Get some real product item numbers from our available products
                  const demoProductItemNumbers = products.slice(0, 6).map(p => p.item_number);
                  
                  // Example data - we'll use only valid product item numbers from our database
                  const exampleData = [
                    ["name", "email", "products"],
                    ["John Smith", "john@example.com", demoProductItemNumbers.slice(0, Math.min(3, demoProductItemNumbers.length)).join(';')],
                    ["Jane Doe", "jane@example.com", demoProductItemNumbers.slice(0, Math.min(2, demoProductItemNumbers.length)).join(';')],
                    ["Bob Johnson", "bob@example.com", ""],
                    ["Sarah Wilson", "sarah@example.com", demoProductItemNumbers.length > 0 ? demoProductItemNumbers[0] : ""]
                  ];
                  
                  // Convert to CSV
                  const csvContent = exampleData.map(row => row.join(",")).join("\n");
                  
                  // Create a demo import
                  setCsvContent(csvContent);
                  setFileUploaded(true);
                  validateCsv(csvContent);
                }}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Try Demo Import
              </button>
            </div>
          </div>
        )}
        
        {isValidating && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium mb-1">Processing Your File</p>
            <p className="text-gray-500 text-sm text-center max-w-sm">
              We're analyzing your CSV data and preparing it for import. This will only take a moment...
            </p>
          </div>
        )}
        
        {showPreview && !isImporting && !importComplete && (
          <>
            <div className="mb-6">
              <div className="bg-blue-50 text-blue-800 p-6 rounded-lg border border-blue-100 mb-4">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-full mr-4 mt-1">
                    <Info className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg text-blue-800">Ready to Import</h4>
                    <p className="text-blue-700 mt-1 mb-2">
                      We've processed your CSV file and found <span className="font-semibold">{importRows.length} customers</span> to import.
                    </p>
                    <p className="text-blue-600 text-sm">
                      Please review the data below to ensure everything looks correct before proceeding.
                    </p>
                  </div>
                </div>
              </div>
              
              {importRows.some(row => row.invalidProducts.length > 0) && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-4 flex items-start">
                  <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-yellow-800">Some Product Item Numbers Not Found</h3>
                    <p className="mt-1 text-yellow-700">
                      Some of the product item numbers in your CSV file don't match any products in your catalog.
                      These products will be skipped during import. Check the table below for details.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => {
                    setCsvContent('')
                    setFileUploaded(false)
                    setShowPreview(false)
                    setImportRows([])
                  }}
                  className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Start Over
                </button>
              </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">#</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">NAME</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">EMAIL</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">PRODUCTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-500">{index + 1}</td>
                        <td className="py-3 px-4">{row.name}</td>
                        <td className="py-3 px-4 text-gray-600">{row.email}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            {row.productIds.length > 0 ? (
                              <button 
                                onClick={() => setShowProductsModal({
                                  rowIndex: index,
                                  products: getProductDetailsByIds(row.productIds)
                                })}
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer"
                              >
                                {row.productIds.length} product{row.productIds.length !== 1 ? 's' : ''}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                No products
                              </span>
                            )}
                            
                            {row.invalidProducts.length > 0 && (
                              <div className="mt-1">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {row.invalidProducts.length} invalid item{row.invalidProducts.length !== 1 ? 's' : ''}
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                  <span className="font-medium">Not found:</span> {row.invalidProducts.join(', ')}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={startImport}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm font-medium"
              >
                <Upload className="h-5 w-5" />
                <span>Start Import Process</span>
              </button>
            </div>
          </>
        )}
        
        {isImporting && (
          <div className="py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Importing Customers</h3>
                <p className="text-gray-500 mt-1">Please wait while we process your data...</p>
              </div>
              
              <div className="bg-blue-50 py-2 px-4 rounded-full text-blue-700 font-medium border border-blue-100">
                {importRows.filter(r => r.status !== 'pending').length} of {importRows.length} processed
              </div>
            </div>
            
            <div className="relative pt-1 mb-8">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                    Progress
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {Math.round((importRows.filter(r => r.status !== 'pending').length / importRows.length) * 100)}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-blue-600 h-3 rounded-full shadow-md transition-all duration-500" 
                  style={{ width: `${(importRows.filter(r => r.status !== 'pending').length / importRows.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                {importRows.filter(r => r.status === 'success').length} successful • 
                {importRows.filter(r => r.status === 'error').length} failed • 
                {importRows.filter(r => r.status === 'pending').length} pending
              </p>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-y-auto max-h-96">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white">
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">#</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">NAME</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">EMAIL</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-500">{index + 1}</td>
                        <td className="py-3 px-4">{row.name}</td>
                        <td className="py-3 px-4 text-gray-600">{row.email}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            {row.status === 'pending' && (
                              <span className="inline-flex items-center text-gray-500">
                                <span className="mr-2 h-2 w-2 bg-gray-200 rounded-full animate-pulse"></span>
                                Pending
                              </span>
                            )}
                            {row.status === 'success' && (
                              <span className="inline-flex items-center text-green-600">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Success
                              </span>
                            )}
                            {row.status === 'error' && (
                              <span className="inline-flex items-center text-red-600">
                                <XCircle className="h-4 w-4 mr-1" />
                                Error: {row.message}
                              </span>
                            )}
                            
                            {row.productIds.length > 0 && (
                              <div className="mt-1">
                                <button 
                                  onClick={() => setShowProductsModal({
                                    rowIndex: index,
                                    products: getProductDetailsByIds(row.productIds)
                                  })}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md text-xs text-blue-800 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  View {row.productIds.length} product{row.productIds.length !== 1 ? 's' : ''}
                                </button>
                              </div>
                            )}
                            
                            {row.invalidProducts.length > 0 && (
                              <div className="mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs text-yellow-800 bg-yellow-50 border border-yellow-100">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {row.invalidProducts.length} product{row.invalidProducts.length !== 1 ? 's' : ''} skipped
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {importComplete && (
          <div className="py-6">
            <div className="bg-white border rounded-lg p-6 shadow-sm mb-6">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Import Complete</h3>
                  <p className="text-gray-600 mt-1">
                    Your customer data has been processed and imported.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 border text-center">
                  <div className="text-3xl font-bold text-gray-800 mb-1">{importStats.total}</div>
                  <div className="text-sm text-gray-600">Total Customers</div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 border border-green-100 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">{importStats.success}</div>
                  <div className="text-sm text-green-700">Successfully Imported</div>
                </div>
                
                <div className={`rounded-lg p-4 border text-center ${
                  importStats.failed > 0 ? 'bg-yellow-50 border-yellow-100' : 'bg-gray-50'
                }`}>
                  <div className={`text-3xl font-bold mb-1 ${
                    importStats.failed > 0 ? 'text-yellow-600' : 'text-gray-400'
                  }`}>
                    {importStats.failed}
                  </div>
                  <div className={`text-sm ${
                    importStats.failed > 0 ? 'text-yellow-700' : 'text-gray-500'
                  }`}>
                    Failed Imports
                  </div>
                </div>
                
                <div className={`rounded-lg p-4 border text-center ${
                  importStats.skippedProducts > 0 ? 'bg-amber-50 border-amber-100' : 'bg-gray-50'
                }`}>
                  <div className={`text-3xl font-bold mb-1 ${
                    importStats.skippedProducts > 0 ? 'text-amber-600' : 'text-gray-400'
                  }`}>
                    {importStats.skippedProducts}
                  </div>
                  <div className={`text-sm ${
                    importStats.skippedProducts > 0 ? 'text-amber-700' : 'text-gray-500'
                  }`}>
                    Skipped Products
                  </div>
                </div>
              </div>
              
              {importStats.failed > 0 && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-4 flex items-start">
                  <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-800">Some Imports Failed</h3>
                    <p className="mt-1 text-yellow-700">
                      There were {importStats.failed} customers that couldn't be imported. 
                      This might be due to duplicate email addresses or invalid data.
                      Please review the error messages in the table below.
                    </p>
                  </div>
                </div>
              )}
              
              {importStats.skippedProducts > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-6 flex items-start">
                  <AlertTriangle className="h-6 w-6 text-amber-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-800">Some Products Were Skipped</h3>
                    <p className="mt-1 text-amber-700">
                      A total of {importStats.skippedProducts} product references couldn't be matched to your catalog.
                      This happens when item numbers in the CSV don't match any products in your system.
                      Check the table below to see which product numbers were invalid.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="border rounded-lg overflow-hidden mb-6">
              <div className="overflow-y-auto max-h-96">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white">
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">#</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">NAME</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">EMAIL</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">RESULT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-500">{index + 1}</td>
                        <td className="py-3 px-4">{row.name}</td>
                        <td className="py-3 px-4 text-gray-600">{row.email}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            {row.status === 'success' && (
                              <span className="inline-flex items-center text-green-600">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Success
                              </span>
                            )}
                            {row.status === 'error' && (
                              <span className="inline-flex items-center text-red-600">
                                <XCircle className="h-4 w-4 mr-1" />
                                {row.message}
                              </span>
                            )}
                            
                            {row.productIds.length > 0 && (
                              <div className="mt-1">
                                <button 
                                  onClick={() => setShowProductsModal({
                                    rowIndex: index,
                                    products: getProductDetailsByIds(row.productIds)
                                  })}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md text-xs text-blue-800 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  View {row.productIds.length} product{row.productIds.length !== 1 ? 's' : ''}
                                </button>
                              </div>
                            )}
                            
                            {row.invalidProducts.length > 0 && (
                              <div className="mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs text-yellow-800 bg-yellow-50 border border-yellow-100">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {row.invalidProducts.length} product{row.invalidProducts.length !== 1 ? 's' : ''} skipped
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                  <span className="font-medium">Not found:</span> {row.invalidProducts.join(', ')}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-4">
              <button
                onClick={() => {
                  setCsvContent('')
                  setFileUploaded(false)
                  setShowPreview(false)
                  setImportRows([])
                  setImportComplete(false)
                }}
                className="px-5 py-3 border border-gray-300 bg-white hover:bg-gray-50 rounded-md transition-colors shadow-sm font-medium text-gray-700 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                Import Another File
              </button>
              <button
                onClick={() => router.push('/admin/customers')}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm font-medium flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                View All Customers
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}