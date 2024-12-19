// src/components/products/SearchBar.tsx
"use client"

import { useState } from 'react'
import { Search } from 'lucide-react'

export function SearchBar() {
  const [query, setQuery] = useState('')

  return (
    <div className="relative max-w-md mb-8">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
    </div>
  )
}