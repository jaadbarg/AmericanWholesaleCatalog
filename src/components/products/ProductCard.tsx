// src/components/products/ProductCard.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Minus, ShoppingCart, Edit2, Check } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { updateProductNotes } from '@/lib/supabase/client'

type Product = {
  id: string
  item_number: string
  description: string
  category: string | null
  customerNote: string
  customerId: string
}

type ProductCardProps = {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [note, setNote] = useState(product.customerNote)
  const [isSavingNote, setIsSavingNote] = useState(false)
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
    setQuantity(1)
  }

  const handleSaveNote = async () => {
    setIsSavingNote(true)
    try {
      await updateProductNotes(product.customerId, product.id, note)
      setIsEditingNote(false)
    } catch (error) {
      console.error('Error saving note:', error)
    } finally {
      setIsSavingNote(false)
    }
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

      <div className="mb-4">
        {isEditingNote ? (
          <div className="space-y-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2 border rounded-md text-sm"
              placeholder="Add your note here..."
              rows={2}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsEditingNote(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
                disabled={isSavingNote}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                disabled={isSavingNote}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <Check size={16} />
                <span>{isSavingNote ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="flex items-start justify-between group"
            onClick={() => setIsEditingNote(true)}
          >
            <p className="text-sm text-gray-500 italic">
              {note ? note : 'Add personal note...'}
            </p>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit2 size={14} className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        )}
      </div>

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