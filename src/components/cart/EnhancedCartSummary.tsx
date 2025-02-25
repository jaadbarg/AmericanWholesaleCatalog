// src/components/cart/EnhancedCartSummary.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Plus, Minus } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function EnhancedCartSummary() { 
  const { items, removeItem, updateQuantity } = useCart()

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
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
        <span>{items.length} {items.length === 1 ? 'item' : 'items'} in cart</span>
        <span>{totalItems} {totalItems === 1 ? 'unit' : 'units'} total</span>
      </div>
      
      <AnimatePresence>
        {sortedItems.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <Badge variant="primary" size="sm" className="mb-1 sm:mb-0 sm:mr-2 w-fit">
                  {item.item_number}
                </Badge>
                <h3 className="font-medium text-gray-800 truncate">{item.description}</h3>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-4">
              <div className="flex items-center">
                <Button
                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                  variant="ghost"
                  size="sm"
                  className="p-1 text-gray-500 hover:text-blue-600"
                  icon={<Minus size={16} />}
                />
                <span className="w-8 text-center font-medium text-gray-800">{item.quantity}</span>
                <Button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  variant="ghost"
                  size="sm"
                  className="p-1 text-gray-500 hover:text-blue-600"
                  icon={<Plus size={16} />}
                />
              </div>

              <Button
                onClick={() => removeItem(item.id)}
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                icon={<Trash2 size={16} />}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      <div className="mt-6 pt-4 border-t flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 hover:bg-red-50 hover:border-red-200"
          onClick={() => {
            if (confirm("Are you sure you want to clear your cart?")) {
              useCart.getState().clearCart();
            }
          }}
        >
          Clear Cart
        </Button>
        
        <div className="text-right">
          <p className="text-sm text-gray-600">
            Total Quantity: <span className="font-semibold">{totalItems}</span>
          </p>
        </div>
      </div>
    </div>
  )
}