// src/components/products/ProductGrid.tsx
"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

type Product = {
  id: string
  item_number: string
  description: string
  category: string | null
}

interface ProductGridProps {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const updateQuantity = (productId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + delta)
    }))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900">{product.item_number}</h3>
            <p className="mt-2 text-gray-600">{product.description}</p>
            {product.category && (
              <span className="mt-2 inline-block px-2 py-1 text-xs font-semibold text-blue-900 bg-blue-100 rounded">
                {product.category}
              </span>
            )}
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateQuantity(product.id, -1)}
                  disabled={!quantities[product.id]}
                  className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center">{quantities[product.id] || 0}</span>
                <button
                  onClick={() => updateQuantity(product.id, 1)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {/* Add to cart logic */}}
                className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold"
              >
                Add to Cart
              </motion.button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

