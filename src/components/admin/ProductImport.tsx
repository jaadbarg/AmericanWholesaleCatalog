'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Upload, CheckCircle, XCircle, AlertTriangle, FileText, Info } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface ImportRow {
  item_number: string
  description: string
  category: string | null
  status: 'pending' | 'success' | 'error'
  message?: string
}

export default function ProductImport() {
  const router = useRouter()
  const supabase = createClientComponentClient()
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
    failed: 0
  })

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
    const itemNumberIndex = headers.indexOf('item_number')
    const descriptionIndex = headers.indexOf('description')
    const categoryIndex = headers.indexOf('category')
    
    if (itemNumberIndex === -1 || descriptionIndex === -1) {
      alert('CSV file must contain "item_number" and "description" columns')
      setIsValidating(false)
      setFileUploaded(false)
      return
    }

    // Parse rows
    const rows: ImportRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      
      if (values.length < Math.max(itemNumberIndex, descriptionIndex) + 1) {
        continue // Skip invalid rows
      }
      
      const item_number = values[itemNumberIndex]
      const description = values[descriptionIndex]
      const category = categoryIndex !== -1 && values.length > categoryIndex ? values[categoryIndex] : null
      
      if (!item_number || !description) {
        continue // Skip rows with missing required fields
      }
      
      rows.push({
        item_number,
        description,
        category,
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
        // Check if product with item_number already exists
        const { data: existingProducts, error: checkError } = await supabase
          .from('products')
          .select('id')
          .eq('item_number', row.item_number)
          .limit(1)
        
        if (checkError) {
          throw new Error(`Error checking if product exists: ${checkError.message}`)
        }
        
        if (existingProducts && existingProducts.length > 0) {
          // If product with this item_number already exists, skip it
          updatedRows[i] = {
            ...row,
            status: 'error',
            message: `Product with item number ${row.item_number} already exists`
          }
          failedCount++
          continue
        }
        
        // Insert new product
        const { error: insertError } = await supabase
          .from('products')
          .insert({
            id: uuidv4(),
            item_number: row.item_number,
            description: row.description,
            category: row.category,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (insertError) {
          throw new Error(`Error inserting product: ${insertError.message}`)
        }
        
        updatedRows[i] = {
          ...row,
          status: 'success',
          message: 'Product created successfully'
        }
        successCount++
      } catch (error) {
        updatedRows[i] = {
          ...row,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
        failedCount++
      }
      
      // Update state after each product
      setImportRows([...updatedRows])
    }
    
    setImportStats({
      total: updatedRows.length,
      success: successCount,
      failed: failedCount
    })
    
    setImportComplete(true)
    setIsImporting(false)
    
    // Refresh the page to update the products list
    router.refresh()
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold mb-2">Bulk Import Products</h2>
        <p className="text-gray-500">
          Upload a CSV file to import multiple products at once.
        </p>
      </div>
      
      <div className="p-6">
        {!fileUploaded && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Upload your CSV file</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              The file should include columns for product item number, description, and optional category.
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
                      <span className="font-medium block mb-1">item_number</span>
                      <span className="text-xs text-gray-500">Unique product identifier</span>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <span className="text-xs font-semibold text-blue-600 block mb-1">REQUIRED</span>
                      <span className="font-medium block mb-1">description</span>
                      <span className="text-xs text-gray-500">Product description</span>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <span className="text-xs font-semibold text-gray-500 block mb-1">OPTIONAL</span>
                      <span className="font-medium block mb-1">category</span>
                      <span className="text-xs text-gray-500">Product category</span>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-100 mt-4 mb-4">
                    <div className="flex">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 flex-shrink-0 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="text-xs text-yellow-800">
                        <strong>Item Number:</strong> Must be unique. If a product with the same item number already exists, it will be skipped during import.
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-700 text-sm mb-2">Example CSV Contents:</h5>
                    <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto whitespace-pre-wrap">
                      item_number,description,category<br/>
                      ABC123,12 oz Paper Cups (1000/case),Disposables<br/>
                      DEF456,16 oz Foam Cups (500/case),Disposables<br/>
                      GHI789,Heavy Duty Aluminum Foil (18" x 1000'),Packaging<br/>
                      JKL012,Bleach (1 gallon),Cleaning Supplies
                    </pre>
                  </div>
                  
                  <div>
                    <a 
                      href="data:text/csv;charset=utf-8,item_number,description,category%0AABC123,12 oz Paper Cups (1000/case),Disposables%0ADEF456,16 oz Foam Cups (500/case),Disposables%0AGHI789,Heavy Duty Aluminum Foil (18%22 x 1000'),Packaging%0AJKL012,Bleach (1 gallon),Cleaning Supplies" 
                      download="product_import_template.csv"
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
                  // Demo data
                  const exampleData = [
                    ["item_number", "description", "category"],
                    ["ABC123", "12 oz Paper Cups (1000/case)", "Disposables"],
                    ["DEF456", "16 oz Foam Cups (500/case)", "Disposables"],
                    ["GHI789", "Heavy Duty Aluminum Foil (18\" x 1000')", "Packaging"],
                    ["JKL012", "Bleach (1 gallon)", "Cleaning Supplies"]
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
                      We've processed your CSV file and found <span className="font-semibold">{importRows.length} products</span> to import.
                    </p>
                    <p className="text-blue-600 text-sm">
                      Please review the data below to ensure everything looks correct before proceeding.
                    </p>
                  </div>
                </div>
              </div>
              
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
                      <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">ITEM NUMBER</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">DESCRIPTION</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">CATEGORY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-500">{index + 1}</td>
                        <td className="py-3 px-4">{row.item_number}</td>
                        <td className="py-3 px-4 text-gray-600">{row.description}</td>
                        <td className="py-3 px-4">
                          {row.category ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {row.category}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              No category
                            </span>
                          )}
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
                <h3 className="text-xl font-semibold text-gray-800">Importing Products</h3>
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
                      <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">ITEM NUMBER</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">DESCRIPTION</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-500">{index + 1}</td>
                        <td className="py-3 px-4">{row.item_number}</td>
                        <td className="py-3 px-4 text-gray-600">{row.description}</td>
                        <td className="py-3 px-4">
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
                    Your product data has been processed and imported.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 border text-center">
                  <div className="text-3xl font-bold text-gray-800 mb-1">{importStats.total}</div>
                  <div className="text-sm text-gray-600">Total Products</div>
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
              </div>
              
              {importStats.failed > 0 && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6 flex items-start">
                  <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-800">Some Imports Failed</h3>
                    <p className="mt-1 text-yellow-700">
                      There were {importStats.failed} products that couldn't be imported. 
                      This might be due to duplicate item numbers or invalid data.
                      Please review the error messages in the table below.
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
                      <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">ITEM NUMBER</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">DESCRIPTION</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">RESULT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-500">{index + 1}</td>
                        <td className="py-3 px-4">{row.item_number}</td>
                        <td className="py-3 px-4 text-gray-600">{row.description}</td>
                        <td className="py-3 px-4">
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
                onClick={() => router.push('/admin/products')}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm font-medium flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                View All Products
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}