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
    <Card animated hoverable className="h-full flex flex-col overflow-visible border-2 border-american-navy-100 hover:border-american-navy-400 transition-colors shadow-sm hover:shadow-md">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Top accent bar with category */}
        {product.category && (
          <div className="bg-gradient-to-r from-american-navy-50 to-american-navy-100 py-2 px-4 border-b border-american-navy-200">
            <Badge variant="primary" rounded size="sm" className="font-medium">
              {product.category}
            </Badge>
          </div>
        )}
        
        <div className="p-6 flex-grow space-y-4">
          {/* Clearer product identification */}
          <div className="mb-3">
            <div className="inline-block bg-american-navy-600 text-white px-4 py-1.5 rounded-md font-mono text-lg font-bold mb-3 shadow-sm">
              {product.item_number}
            </div>
            <h3 className="text-xl font-bold text-gray-800 leading-tight">{product.description}</h3>
          </div>
          
          {/* Clear separator */}
          <div className="border-t border-dashed border-american-navy-200 my-4"></div>
          
          {/* Quantity selector with larger controls and clearer labeling */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-american-navy-700 mb-2">Select Quantity:</label>
            <div className="flex items-center">
              <div className="flex items-center bg-white border-2 border-american-navy-200 rounded-lg shadow-sm">
                <button
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className="p-3 text-gray-700 hover:bg-gray-50 disabled:text-gray-300 focus:outline-none rounded-l-lg"
                  aria-label="Decrease quantity"
                >
                  <Minus size={20} />
                </button>
                
                <div className="w-16 text-center font-bold text-gray-700 text-lg border-l border-r border-gray-200">
                  {quantity}
                </div>
                
                <button
                  onClick={incrementQuantity}
                  className="p-3 text-gray-700 hover:bg-gray-50 focus:outline-none rounded-r-lg"
                  aria-label="Increase quantity"
                >
                  <Plus size={20} />
                </button>
              </div>
              
              <span className="ml-3 text-gray-500">units</span>
            </div>
          </div>
          
          {/* Notes section - simplified UI */}
          <div className="mt-4">
            <AnimatePresence mode="wait">
              {isEditingNote ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2 border rounded-lg p-3 bg-gray-50"
                >
                  <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <Notebook size={16} className="mr-2 text-american-navy-600" />
                    <span>Your Notes</span>
                  </div>
                  <TextArea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full text-base"
                    placeholder="Add special instructions or notes about this product..."
                    rows={2}
                  />
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingNote(false)}
                      disabled={isSavingNote}
                      icon={<X size={16} />}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveNote}
                      disabled={isSavingNote}
                      isLoading={isSavingNote}
                      icon={<Save size={16} />}
                    >
                      Save Note
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="viewing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border border-dashed border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setIsEditingNote(true)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm font-medium text-gray-700">
                      <Notebook size={16} className="mr-2 text-american-navy-600" />
                      <span>{note ? 'Your Notes' : 'Add Notes'}</span>
                    </div>
                    <Edit2 size={16} className="text-gray-500" />
                  </div>
                  
                  {note && (
                    <p className="mt-2 text-sm text-gray-700 italic bg-white p-2 rounded border border-gray-100">
                      {note}
                    </p>
                  )}
                  
                  {!note && (
                    <p className="mt-2 text-sm text-gray-500">
                      Click to add special instructions or notes about this product...
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Add to cart button - full width and more prominent */}
        <div className="p-4 border-t border-american-navy-100">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleAddToCart}
            icon={isAdded ? <Check size={20} /> : <ShoppingCart size={20} />}
            disabled={isAdded}
            className="py-3 text-lg bg-american-navy-600 hover:bg-american-navy-700 shadow-sm"
          >
            {isAdded ? 'Added to Cart! ✓' : 'Add to Cart'}
          </Button>
          
          {/* Success animation */}
          <AnimatePresence>
            {isAdded && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center mt-2 text-green-600 font-medium"
              >
                <div className="mb-1">Item successfully added to your cart!</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-american-navy-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = '/cart';
                  }}
                >
                  Go to Cart
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}