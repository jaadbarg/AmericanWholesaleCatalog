// src/components/products/SearchBar.tsx
"use client"

import { useState, useEffect, useRef } from 'react'
import { Search, X, ArrowUpRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type SearchBarProps = {
  onSearch: (query: string) => void
  initialQuery?: string
  recentSearches?: string[]
  onSaveRecentSearch?: (query: string) => void
}

export function SearchBar({ 
  onSearch, 
  initialQuery = '',
  recentSearches = [],
  onSaveRecentSearch 
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle outside clicks to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsFocused(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])
  
  // Handle search submission
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    if (query.trim()) {
      onSearch(query.trim())
      if (onSaveRecentSearch) {
        onSaveRecentSearch(query.trim())
      }
      setIsFocused(false)
    }
  }

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  // Clear search input
  const handleClear = () => {
    setQuery('')
    onSearch('')
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  // Handle selecting a recent search
  const handleSelectRecent = (searchTerm: string) => {
    setQuery(searchTerm)
    onSearch(searchTerm)
    setIsFocused(false)
  }

  return (
    <div className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          placeholder="Search products by name or item number..."
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          aria-label="Search products"
        />
        
        <Search 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          size={18} 
        />
        
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </form>

      {/* Recent searches dropdown */}
      <AnimatePresence>
        {isFocused && recentSearches.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden"
          >
            <div className="p-2">
              <div className="text-xs text-gray-500 px-3 py-1 uppercase tracking-wider">
                Recent Searches
              </div>
              
              <div className="mt-1">
                {recentSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectRecent(term)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center justify-between group"
                  >
                    <div className="flex items-center">
                      <Search size={14} className="mr-2 text-gray-400" />
                      <span>{term}</span>
                    </div>
                    <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}