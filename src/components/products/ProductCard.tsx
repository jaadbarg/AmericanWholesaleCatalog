// src/components/products/ProductCard.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Minus, ShoppingCart, Edit2, Check, Notebook } from 'lucide-react'
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
  const [isAdded, setIsAdded] = useState(false)
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
    
    // Show feedback animation
    setIsAdded(true)
    setTimeout(() => {
      setIsAdded(false)
      setQuantity(1)
    }, 1000)
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
    <motion.div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold">{product.item_number}</h3>
          
          {product.category && (
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              {product.category}
            </span>
          )}
        </div>
        
        <p className="text-gray-600 mb-4">{product.description}</p>
        
        {/* Notes section */}
        <div className="mb-4">
          {isEditingNote ? (
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <Notebook size={14} className="mr-1" />
                <span>Your notes for this product</span>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add your note here..."
                rows={2}
              />
              <div className="flex justify-end space-x-2">
                <motion.button
                  onClick={() => setIsEditingNote(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1"
                  disabled={isSavingNote}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSaveNote}
                  disabled={isSavingNote}
                  className="flex items-center space-x-1 text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-100"
                  whileTap={{ scale: 0.95 }}
                >
                  {isSavingNote ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                        <circle 
                          className="opacity-25" 
                          cx="12" 
                          cy="12" 
                          r="10" 
                          stroke="currentColor" 
                          strokeWidth="4"
                        />
                        <path 
                          className="opacity-75" 
                          fill="currentColor" 
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Saving</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          ) : (
            <div 
              className="group p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => setIsEditingNote(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <Notebook size={14} className="mr-1" />
                  <span>Notes</span>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit2 size={14} className="text-gray-400 group-hover:text-gray-600" />
                </button>
              </div>
              
              <p className="mt-1 text-sm text-gray-700 italic">
                {note ? note : <span className="text-gray-400">Add personal note...</span>}
              </p>
            </div>
          )}
        </div>

        {/* Quantity and add-to-cart section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <button
              onClick={decrementQuantity}
              className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Decrease quantity"
            >
              <Minus size={18} />
            </button>
            
            <div className="w-12 text-center font-medium text-gray-700">
              {quantity}
            </div>
            
            <button
              onClick={incrementQuantity}
              className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Increase quantity"
            >
              <Plus size={18} />
            </button>
          </div>

          <motion.button
            onClick={handleAddToCart}
            className={`flex items-center justify-center space-x-2 ${
              isAdded 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-900 hover:bg-blue-800'
            } text-white px-4 py-2 rounded-lg w-full sm:w-auto transition-colors`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={isAdded}
          >
            {isAdded ? (
              <>
                <Check size={18} />
                <span>Added!</span>
              </>
            ) : (
              <>
                <ShoppingCart size={18} />
                <span>Add to Cart</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}