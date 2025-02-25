// src/components/products/EnhancedProductCard.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, ShoppingCart, Check, Edit2, Notebook, Save, X } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { updateProductNotes } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TextArea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

type Product = {
  id: string
  item_number: string
  description: string
  category: string | null
  customerNote: string
  customerId: string
}

type EnhancedProductCardProps = {
  product: Product
}

export function EnhancedProductCard({ product }: EnhancedProductCardProps) {
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
    }, 1500)
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
    <Card animated hoverable className="h-full flex flex-col overflow-visible">
      <CardContent className="p-0 flex flex-col h-full">
        <div className="p-6 flex-grow space-y-4">
          {/* Header with Item Number and Category */}
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-blue-900">{product.item_number}</h3>
            
            {product.category && (
              <Badge variant="primary" rounded>
                {product.category}
              </Badge>
            )}
          </div>
          
          {/* Description */}
          <p className="text-gray-700">{product.description}</p>
          
          {/* Notes section */}
          <div className="mt-auto pt-4">
            <AnimatePresence mode="wait">
              {isEditingNote ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <Notebook size={14} className="mr-1" />
                    <span>Your notes for this product</span>
                  </div>
                  <TextArea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full text-sm"
                    placeholder="Add your note here..."
                    rows={2}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingNote(false)}
                      disabled={isSavingNote}
                      icon={<X size={14} />}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveNote}
                      disabled={isSavingNote}
                      isLoading={isSavingNote}
                      icon={<Save size={14} />}
                    >
                      Save
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="viewing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="group p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setIsEditingNote(true)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Notebook size={14} className="mr-1" />
                      <span>Notes</span>
                    </div>
                    <motion.button
                      className="opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Edit2 size={14} className="text-gray-400 group-hover:text-gray-600" />
                    </motion.button>
                  </div>
                  
                  <p className="mt-1 text-sm text-gray-700 italic">
                    {note ? note : <span className="text-gray-400">Add personal note...</span>}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Quantity and add-to-cart section */}
        <div className="bg-gray-50 p-4 rounded-b-lg border-t flex items-center justify-between gap-4">
          <div className="flex items-center bg-white border rounded-md shadow-sm">
            <motion.button
              onClick={decrementQuantity}
              disabled={quantity <= 1}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:text-gray-300 focus:outline-none"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Minus size={16} />
            </motion.button>
            
            <span className="w-10 text-center font-medium text-gray-700">
              {quantity}
            </span>
            
            <motion.button
              onClick={incrementQuantity}
              className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Plus size={16} />
            </motion.button>
          </div>

          <Button
            variant="primary"
            onClick={handleAddToCart}
            icon={isAdded ? <Check size={16} /> : <ShoppingCart size={16} />}
            disabled={isAdded}
          >
            {isAdded ? 'Added!' : 'Add to Cart'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}