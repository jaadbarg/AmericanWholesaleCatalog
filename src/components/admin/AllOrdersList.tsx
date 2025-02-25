'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, ChevronDown, ChevronRight, Eye, Calendar, Download } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

type OrderItem = {
  id: string
  quantity: number
  product_id: string
  product: {
    id: string
    item_number: string
    description: string
    category: string
  } | null
}

type Order = {
  id: string
  created_at: string
  delivery_date: string
  notes: string | null
  status: string
  customers: {
    id: string
    name: string
    email: string
  } | null
  order_items: OrderItem[]
}

export default function AllOrdersList({ initialOrders }: { initialOrders: Order[] }) {
  const [orders] = useState<Order[]>(initialOrders)
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(initialOrders)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDateRange, setFilterDateRange] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date-desc')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  
  // Define the CSV generation function
  const generateCSV = React.useCallback(() => {
    // Create CSV header row
    const headers = ['Order ID', 'Date', 'Customer', 'Email', 'Status', 'Delivery Date', 'Items', 'Notes']
    
    // Helper function to escape CSV fields properly
    const escapeCSV = (field: string | null | undefined) => {
      if (field === null || field === undefined) return '""'
      
      // If field contains commas, newlines, or quotes, wrap in quotes and escape internal quotes
      const stringValue = String(field)
      const needsQuotes = stringValue.includes(',') || 
                          stringValue.includes('\n') || 
                          stringValue.includes('"') ||
                          stringValue.includes(';')
                          
      if (needsQuotes) {
        // Double up any quotes in the content
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      
      return stringValue
    }
    
    // Create CSV data rows
    const rows = filteredOrders.map(order => {
      const itemsText = order.order_items
        .map(item => `${item.quantity}x ${item.product?.item_number || 'Unknown'} - ${item.product?.description || 'Unknown'}`)
        .join('; ')
        
      return [
        escapeCSV(order.id),
        escapeCSV(new Date(order.created_at).toLocaleDateString()),
        escapeCSV(order.customers?.name || 'Unknown'),
        escapeCSV(order.customers?.email || 'Unknown'),
        escapeCSV(order.status),
        escapeCSV(new Date(order.delivery_date).toLocaleDateString()),
        escapeCSV(itemsText),
        escapeCSV(order.notes || '')
      ].join(',')
    })
    
    // Combine headers and rows
    const headerRow = headers.map(header => escapeCSV(header)).join(',')
    const csvContent = [headerRow, ...rows].join('\n')
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `orders-export-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Cleanup
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }, [filteredOrders])

  // Add effect to handle dashboard export link click
  useEffect(() => {
    const dashboardExportLink = document.getElementById('dashboard-export-link')
    if (dashboardExportLink) {
      dashboardExportLink.addEventListener('click', (e) => {
        e.preventDefault()
        generateCSV()
      })
    }
    
    return () => {
      if (dashboardExportLink) {
        dashboardExportLink.removeEventListener('click', generateCSV)
      }
    }
  }, [generateCSV])

  useEffect(() => {
    // Apply filters and search
    let result = [...orders]
    
    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(order => order.status === filterStatus)
    }
    
    // Apply date range filter
    if (filterDateRange !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      switch (filterDateRange) {
        case 'today':
          result = result.filter(order => {
            const orderDate = new Date(order.created_at)
            return orderDate >= today
          })
          break
        case 'week':
          const lastWeek = new Date(today)
          lastWeek.setDate(lastWeek.getDate() - 7)
          result = result.filter(order => {
            const orderDate = new Date(order.created_at)
            return orderDate >= lastWeek
          })
          break
        case 'month':
          const lastMonth = new Date(today)
          lastMonth.setMonth(lastMonth.getMonth() - 1)
          result = result.filter(order => {
            const orderDate = new Date(order.created_at)
            return orderDate >= lastMonth
          })
          break
        case 'year':
          const lastYear = new Date(today)
          lastYear.setFullYear(lastYear.getFullYear() - 1)
          result = result.filter(order => {
            const orderDate = new Date(order.created_at)
            return orderDate >= lastYear
          })
          break
      }
    }
    
    // Apply search
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      result = result.filter(order => 
        // Search by order ID
        order.id.toLowerCase().includes(lowerSearchTerm) ||
        // Search by customer name or email
        (order.customers?.name.toLowerCase().includes(lowerSearchTerm) || 
         order.customers?.email.toLowerCase().includes(lowerSearchTerm)) ||
        // Search by product descriptions
        order.order_items.some(item => 
          item.product?.description.toLowerCase().includes(lowerSearchTerm) ||
          item.product?.item_number.toLowerCase().includes(lowerSearchTerm)
        )
      )
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'date-desc':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'date-asc':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'delivery-asc':
        result.sort((a, b) => new Date(a.delivery_date).getTime() - new Date(b.delivery_date).getTime())
        break
      case 'delivery-desc':
        result.sort((a, b) => new Date(b.delivery_date).getTime() - new Date(a.delivery_date).getTime())
        break
    }
    
    setFilteredOrders(result)
  }, [orders, searchTerm, filterStatus, filterDateRange, sortBy])

  function getStatusStyle(status: string) {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      {/* Search and Filters */}
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search orders by ID, customer, or products..."
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Export Button */}
          <button
            onClick={generateCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
        
        {/* Expanded Filters */}
        {isFiltersOpen && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            
            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="date-desc">Date (Newest First)</option>
                <option value="date-asc">Date (Oldest First)</option>
                <option value="delivery-asc">Delivery Date (Earliest First)</option>
                <option value="delivery-desc">Delivery Date (Latest First)</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* Results Count */}
      <div className="px-4 py-3 bg-gray-50 border-b">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium">{filteredOrders.length}</span> {filteredOrders.length === 1 ? 'order' : 'orders'}
          {searchTerm && <span> matching "<span className="font-medium">{searchTerm}</span>"</span>}
          {filterStatus !== 'all' && <span> with status <span className="font-medium">{filterStatus}</span></span>}
        </p>
      </div>
      
      {/* Results Table */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No matching orders found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Delivery</th>
                <th className="px-4 py-3">Items</th>
                {/* <th className="px-4 py-3 text-right">Actions</th> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-medium">
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        {expandedOrder === order.id ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                        }
                        #{order.id.slice(0, 8)}
                        <span className="text-xs text-gray-400 ml-1">({order.id})</span>
                      </button>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {format(new Date(order.created_at), 'MMM d, yyyy')}
                      <div className="text-xs">{format(new Date(order.created_at), 'h:mm a')}</div>
                    </td>
                    <td className="px-4 py-4">
                      {order.customers ? (
                        <>
                          <div className="text-sm font-medium text-gray-900">
                            {order.customers.name || 'Unknown name'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.customers.email || 'No email'}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-amber-600">
                          Customer information unavailable
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(order.delivery_date), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {order.order_items.length} {order.order_items.length === 1 ? 'item' : 'items'}
                    </td>
                    {/* <td className="px-4 py-4 text-right text-sm">
                      <Link 
                        href={`/admin/orders/${encodeURIComponent(order.id)}`}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </Link>
                    </td> */}
                  </tr>
                  
                  {/* Expanded Order Details */}
                  {expandedOrder === order.id && (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 bg-gray-50">
                        <div className="pl-6">
                          <h4 className="font-medium text-sm mb-2">Order Items:</h4>
                          <ul className="pl-5 list-disc space-y-1 text-sm text-gray-600">
                            {order.order_items.map((item) => (
                              <li key={item.id}>
                                {item.product ? (
                                  <span>
                                    {item.quantity}x {item.product.item_number} - {item.product.description}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">Product information not available</span>
                                )}
                              </li>
                            ))}
                          </ul>
                          
                          {order.notes && (
                            <div className="mt-3">
                              <h4 className="font-medium text-sm mb-1">Notes:</h4>
                              <p className="text-sm text-gray-600 bg-white p-2 rounded border">{order.notes}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}