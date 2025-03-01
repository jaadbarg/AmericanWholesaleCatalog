// src/components/cart/EnhancedCartSummary.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Plus, Minus, AlertTriangle, X, CheckCircle } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function EnhancedCartSummary() { 
  const { items, removeItem, updateQuantity, clearCart } = useCart()
  const [showClearCartModal, setShowClearCartModal] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Your cart is empty</p>
      </div>
    )
  }

  // Group items by category if possible
  const getItemCategory = (itemNumber: string) => {
    // This is a simple heuristic - in a real app, you'd likely have the category data
    const prefix = itemNumber.match(/^[A-Za-z]+/)?.[0] || '';
    return prefix;
  };

  // Sort items by item number
  const sortedItems = [...items].sort((a, b) => {
    const catA = getItemCategory(a.item_number);
    const catB = getItemCategory(b.item_number);
    
    if (catA !== catB) {
      return catA.localeCompare(catB);
    }
    
    return a.item_number.localeCompare(b.item_number);
  });

  // Calculate cart totals
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Instruction header for clarity */}
      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-gray-700 font-medium">
            {items.length} {items.length === 1 ? 'item' : 'items'} ({totalItems} {totalItems === 1 ? 'unit' : 'units'} total)
          </span>
        </div>
        <p className="text-sm text-gray-500">You can adjust quantities below</p>
      </div>
      
      {/* Descriptive header for the items list */}
      <div className="pb-2 border-b border-gray-200 grid grid-cols-12 text-sm font-medium text-gray-500 hidden md:grid">
        <div className="col-span-6">Item</div>
        <div className="col-span-3 text-center">Quantity</div>
        <div className="col-span-3 text-right">Actions</div>
      </div>
      
      <AnimatePresence>
        {sortedItems.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="p-5 bg-white rounded-lg border-2 border-gray-100 hover:border-american-navy-100 transition-all"
          >
            {/* Mobile layout (stacked) */}
            <div className="flex flex-col md:hidden">
              <div className="mb-3">
                <div className="inline-block bg-american-navy-100 text-american-navy-800 px-2 py-1 rounded font-mono font-bold text-sm mb-2">
                  {item.item_number}
                </div>
                <h3 className="font-medium text-gray-800">{item.description}</h3>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Quantity:</span>
                  <div className="flex items-center border rounded-md bg-white">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="px-1 py-1 text-blue-700 hover:bg-blue-50 rounded-l-md"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-medium text-gray-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-1 py-1 text-blue-700 hover:bg-blue-50 rounded-r-md"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                
                <Button
                  onClick={() => removeItem(item.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-100 hover:bg-red-50"
                  icon={<Trash2 size={14} />}
                >
                  Remove
                </Button>
              </div>
            </div>
            
            {/* Desktop layout (grid) */}
            <div className="hidden md:grid md:grid-cols-12 md:gap-6 md:items-center">
              {/* Item info */}
              <div className="col-span-6 pr-4">
                <div className="inline-block bg-american-navy-100 text-american-navy-800 px-2 py-1 rounded font-mono font-bold text-sm mb-2">
                  {item.item_number}
                </div>
                <h3 className="font-medium text-gray-800">{item.description}</h3>
              </div>
              
              {/* Quantity controls - even more compact */}
              <div className="col-span-3 flex items-center">
                <div className="flex items-center border rounded-md bg-white">
                  <button
                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center text-american-navy-700 hover:bg-american-navy-50 rounded-l-md"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-medium text-gray-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-american-navy-700 hover:bg-american-navy-50 rounded-r-md"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="ml-2 text-xs text-gray-500">units</span>
              </div>
              
              {/* Actions - clear labeling */}
              <div className="col-span-3 flex justify-end">
                <Button
                  onClick={() => removeItem(item.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-100 hover:bg-red-50 hover:border-red-200"
                  icon={<Trash2 size={14} />}
                >
                  Remove
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Clear cart section with confirmation */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center">
              <div className="flex-1">
                <div className="text-lg font-medium text-gray-800">Order Total:</div>
                <p className="text-gray-600">
                  {items.length} {items.length === 1 ? 'item' : 'items'}, {totalItems} total units
                </p>
              </div>
              <div className="bg-american-navy-50 px-4 py-2 rounded-lg border border-american-navy-100">
                <span className="text-lg font-bold text-american-navy-800">{totalItems}</span>
                <span className="text-american-navy-700 ml-1">units</span>
              </div>
            </div>
          </div>
          
          <div>
            <Button
              variant="outline"
              size="md"
              className="text-red-600 border-red-200 hover:bg-red-50"
              icon={<Trash2 size={18} />}
              onClick={() => setShowClearCartModal(true)}
            >
              Clear Entire Cart
            </Button>
          </div>
        </div>
      </div>
      
      {/* Help text */}
      <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm text-yellow-800">
        <p>
          <span className="font-medium">Need to change something?</span> You can adjust quantities or remove items above. 
          When you're ready to submit your order, complete the form on the right.
        </p>
      </div>
      
      {/* Clear Cart Modal */}
      <AnimatePresence>
        {showClearCartModal && (
          <>
            {/* Overlay backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setShowClearCartModal(false)}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 max-w-md w-full z-50"
            >
              <div className="flex items-start mb-4">
                <div className="bg-red-100 p-3 rounded-full mr-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Clear Your Cart?</h3>
                  <p className="text-gray-600">
                    You're about to remove all items from your cart. This action cannot be undone.
                  </p>
                </div>
                <button 
                  className="ml-auto bg-gray-100 p-1 rounded-full hover:bg-gray-200"
                  onClick={() => setShowClearCartModal(false)}
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-gray-600">
                  Your cart contains <span className="font-bold">{items.length}</span> {items.length === 1 ? 'product' : 'products'} with a total of <span className="font-bold">{items.reduce((acc, item) => acc + item.quantity, 0)}</span> units.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowClearCartModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    clearCart();
                    setShowClearCartModal(false);
                    setShowSuccessMessage(true);
                    setTimeout(() => setShowSuccessMessage(false), 3000);
                  }}
                >
                  Clear Cart
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Success Message Toast */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border-l-4 border-green-500 p-4 flex items-center max-w-md z-50"
          >
            <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-gray-900">Cart Cleared</h4>
              <p className="text-sm text-gray-600">All items have been removed from your cart</p>
            </div>
            <button 
              className="ml-4 text-gray-400 hover:text-gray-500"
              onClick={() => setShowSuccessMessage(false)}
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}