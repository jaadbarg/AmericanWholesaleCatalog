'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCustomerWithProducts, Product } from '@/lib/supabase/client'
import { Upload, CheckCircle, XCircle, AlertTriangle, FileText, Info } from 'lucide-react'

interface CustomerImportProps {
  products: Product[]
}

interface ImportRow {
  name: string
  email: string
  productIds: string[]
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
    failed: 0
  })

  // Product ID lookup by item number
  const productLookup = products.reduce((acc, product) => {
    acc[product.item_number] = product.id
    return acc
  }, {} as Record<string, string>)

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
      if (productIndex !== -1 && values[productIndex]) {
        const productItems = values[productIndex].split(';').map(p => p.trim())
        
        productIds = productItems
          .map(item => productLookup[item])
          .filter(Boolean) as string[]
      }
      
      rows.push({
        name,
        email,
        productIds,
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
        const result = await createCustomerWithProducts(
          { name: row.name, email: row.email },
          row.productIds
        )
        
        if (result.success) {
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
            message: result.message || 'Unknown error'
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
    
    setImportStats({
      total: updatedRows.length,
      success: successCount,
      failed: failedCount
    })
    
    setImportComplete(true)
    setIsImporting(false)
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
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
            
            <div className="bg-gray-50 p-4 rounded-md text-left mb-6 max-w-md mx-auto">
              <div className="flex items-start mb-2">
                <FileText className="h-5 w-5 text-gray-500 mr-2 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-700">CSV Format Example:</h4>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                    name,email,products<br/>
                    John Smith,john@example.com,A001;B002;C003<br/>
                    Jane Doe,jane@example.com,D004;E005
                  </pre>
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
            <label
              htmlFor="csvUpload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
            >
              Select CSV File
            </label>
          </div>
        )}
        
        {isValidating && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Validating CSV file...</p>
          </div>
        )}
        
        {showPreview && !isImporting && !importComplete && (
          <>
            <div className="mb-6 flex items-start">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-md flex-1">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Ready to import {importRows.length} customers</h4>
                    <p className="text-sm mt-1">
                      Please review the data below before proceeding with the import.
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setCsvContent('')
                  setFileUploaded(false)
                  setShowPreview(false)
                  setImportRows([])
                }}
                className="ml-4 text-gray-500 hover:text-gray-700"
              >
                Reset
              </button>
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
                        <td className="py-3 px-4 text-gray-500">
                          {row.productIds.length > 0 ? `${row.productIds.length} products` : 'None'}
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
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span>Start Import</span>
              </button>
            </div>
          </>
        )}
        
        {isImporting && (
          <div className="py-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Importing customers...</h3>
              <div className="text-sm text-gray-500">
                {importRows.filter(r => r.status !== 'pending').length} of {importRows.length} processed
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${(importRows.filter(r => r.status !== 'pending').length / importRows.length) * 100}%` }}
              ></div>
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
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-md p-4 mb-6 flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium">Import Complete</h3>
                <p className="mt-1">
                  Successfully imported {importStats.success} of {importStats.total} customers.
                  {importStats.failed > 0 && ` ${importStats.failed} customers failed to import.`}
                </p>
              </div>
            </div>
            
            {importStats.failed > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md p-4 mb-6 flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium">Some Imports Failed</h3>
                  <p className="mt-1">
                    There were {importStats.failed} customers that couldn't be imported. 
                    Please review the error messages in the table below.
                  </p>
                </div>
              </div>
            )}
            
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
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setCsvContent('')
                  setFileUploaded(false)
                  setShowPreview(false)
                  setImportRows([])
                  setImportComplete(false)
                }}
                className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-md transition-colors"
              >
                Import Another File
              </button>
              <button
                onClick={() => router.push('/admin/customers')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Go to Customers
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}