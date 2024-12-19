// src/components/products/ProductCard.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Minus, ShoppingCart } from 'lucide-react'
import { useCart } from '@/hooks/useCart'

type Product = {
  id: string
  item_number: string
  description: string
  category: string | null
}

type ProductCardProps = {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)
  const addItem = useCart((state) => state.addItem)

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1)
  }

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1))
  }

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      item_number: product.item_number,
      description: product.description,
      quantity
    })
    // Reset quantity after adding to cart
    setQuantity(1)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-2">{product.item_number}</h3>
      <p className="text-gray-600 mb-4">{product.description}</p>
      
      {product.category && (
        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mb-4">
          {product.category}
        </span>
      )}

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={decrementQuantity}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <Minus size={20} />
          </button>
          <span className="w-8 text-center font-medium">{quantity}</span>
          <button
            onClick={incrementQuantity}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <Plus size={20} />
          </button>
        </div>

        <motion.button
          onClick={handleAddToCart}
          className="flex items-center space-x-2 bg-blue-900 text-white px-4 py-2 rounded-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ShoppingCart size={16} />
          <span>Add to Cart</span>
        </motion.button>
      </div>
    </div>
  )
}