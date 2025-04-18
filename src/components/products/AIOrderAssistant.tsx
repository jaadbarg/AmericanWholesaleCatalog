'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, ShoppingCart, X, Bot, User, ArrowRight } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import Image from 'next/image'
import Link from 'next/link'

type Product = {
  id: string
  item_number: string
  description: string
  category: string | null
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type SuggestedProduct = {
  id: string
  item_number: string
  description: string
  quantity: number
  category?: string | null
  confidence: 'high' | 'medium' | 'low'
  customerNote?: string
}

export function AIOrderAssistant({ 
  products, 
  customerName, 
  previousOrders,
  customerId
}: { 
  products: Product[]
  customerName: string
  previousOrders?: any[]
  customerId: string
}) {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'welcome-message',
      role: 'assistant', 
      content: `Hello ${customerName}! I'm your AI order assistant for American Wholesalers. I can help you find and order products using natural language.\n\nTry phrases like:\n- "What types of products are available to me?"\n- "Order the same as last time but make it 5x of each item"\n- "Show me your aluminum pan offerings"\n- "What do you have in the plastic utensils category?"\n\nJust tell me what you need, and I'll find the right products for you!` 
    }
  ])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Cart integration
  const { addItem } = useCart()
  const [suggestedProducts, setSuggestedProducts] = useState<SuggestedProduct[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  
  // UI state
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize input field
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  }, [input])

  // We now use the API for product search instead of local logic

  // Handle sending user message
  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return
    
    const userMessage = input.trim()
    setInput('')
    setIsProcessing(true)
    
    // Add user message to chat with unique ID
    setMessages(prev => [...prev, { 
      id: `user-${Date.now()}`, 
      role: 'user', 
      content: userMessage 
    }])
    
    try {
      // Call the API endpoint for AI processing
      const response = await fetch('/api/ai/process-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          customerId: customerId,
          chatHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })) // Send previous messages without ids for context
        }),
      })
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }
      
      const result = await response.json()
      
      // Update suggested products from AI response
      setSuggestedProducts(result.suggestedProducts || [])
      
      // Add AI response to chat with unique ID
      setMessages(prev => [...prev, { 
        id: `assistant-${Date.now()}`,
        role: 'assistant', 
        content: result.aiResponse || 'I processed your request but couldn\'t generate a proper response.' 
      }])
      
    } catch (error) {
      console.error('Error processing message:', error)
      setMessages(prev => [...prev, { 
        id: `assistant-error-${Date.now()}`,
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request. Please try again.' 
      }])
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle input field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  // Handle pressing Enter to send
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Toggle product selection
  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts)
    if (newSelection.has(productId)) {
      newSelection.delete(productId)
    } else {
      newSelection.add(productId)
    }
    setSelectedProducts(newSelection)
  }

  // Update product quantity
  const updateProductQuantity = (productId: string, newQuantity: number) => {
    setSuggestedProducts(prev => 
      prev.map(p => p.id === productId ? {...p, quantity: newQuantity} : p)
    )
  }

  // Add selected products to cart
  const addSelectedProductsToCart = () => {
    setIsAddingToCart(true)
    
    // Get selected products with quantities
    const productsToAdd = suggestedProducts
      .filter(p => selectedProducts.has(p.id))
    
    if (productsToAdd.length === 0) {
      setIsAddingToCart(false)
      return
    }
    
    // Add each product to cart
    for (const product of productsToAdd) {
      addItem({
        id: product.id,
        item_number: product.item_number,
        description: product.description,
        quantity: product.quantity
      })
    }
    
    // Add confirmation message to chat
    const productList = productsToAdd
      .map(p => `${p.quantity}x ${p.item_number} (${p.description})`)
      .join('\n')
    
    setMessages(prev => [...prev, { 
      id: `assistant-cart-${Date.now()}`,
      role: 'assistant', 
      content: `I've added the following products to your cart:\n\n${productList}\n\nAnything else I can help you with?` 
    }])
    
    // Clear selections and suggestions
    setSelectedProducts(new Set())
    setSuggestedProducts([])
    setIsAddingToCart(false)
  }

  return (
    <div className="flex flex-col h-full max-h-[80vh] bg-white rounded-xl shadow-md overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b bg-blue-900 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-300" />
          <h2 className="font-semibold">AI Order Assistant</h2>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedProducts.size > 0 && (
            <motion.button
              onClick={addSelectedProductsToCart}
              disabled={isAddingToCart}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {isAddingToCart ? (
                <span className="flex items-center">
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                  Adding...
                </span>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  <span>Add {selectedProducts.size} to Cart</span>
                </>
              )}
            </motion.button>
          )}
          
          <Link 
            href="/cart" 
            className="flex items-center gap-1 px-3 py-1.5 bg-white text-blue-900 text-sm rounded-md hover:bg-gray-100 transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Go to Cart</span>
          </Link>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex-shrink-0 rounded-full p-2 ${
                    message.role === 'user' ? 'bg-blue-100' : 'bg-blue-900 text-white'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div className={`py-2 px-4 rounded-xl ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white border rounded-tl-none shadow-sm'
                  }`}>
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Display typing indicator when processing */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-start gap-2 max-w-[80%]">
                  <div className="flex-shrink-0 rounded-full p-2 bg-blue-900 text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="py-3 px-4 rounded-xl bg-white border rounded-tl-none shadow-sm">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Product suggestions panel (when available) */}
        <AnimatePresence>
          {suggestedProducts.length > 0 && (
            <motion.div 
              className="w-64 lg:w-80 border-l overflow-y-auto bg-white"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-3 border-b">
                <h3 className="font-medium text-sm flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <span>Suggested Products</span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Select products to add to your cart
                </p>
              </div>
              
              <div className="p-3 space-y-3">
                {suggestedProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    className={`p-3 rounded-lg border ${
                      selectedProducts.has(product.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate">
                            {product.item_number}
                          </h4>
                          <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full font-medium">
                            {product.quantity}x
                          </span>
                          {product.confidence === 'high' && (
                            <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded">
                              Match
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                          {product.description}
                        </p>
                        
                        {product.customerNote && (
                          <p className="text-xs text-amber-700 bg-amber-50 p-1.5 rounded mt-1.5 italic">
                            <span className="font-medium">Note:</span> {product.customerNote}
                          </p>
                        )}
                        
                        {selectedProducts.has(product.id) && (
                          <div className="mt-2 flex items-center">
                            <button
                              onClick={() => updateProductQuantity(product.id, Math.max(1, product.quantity - 1))}
                              className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-8 text-center text-sm">{product.quantity}</span>
                            <button
                              onClick={() => updateProductQuantity(product.id, product.quantity + 1)}
                              className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => toggleProductSelection(product.id)}
                        className={`p-1.5 rounded-full ${
                          selectedProducts.has(product.id)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {selectedProducts.has(product.id) ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Input area */}
      <div className="p-3 border-t bg-white">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your order request..."
              className="w-full py-2 px-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none max-h-32 min-h-[40px]"
              rows={1}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isProcessing}
            className={`p-2.5 rounded-lg ${
              !input.trim() || isProcessing
                ? 'bg-gray-100 text-gray-400'
                : 'bg-blue-900 text-white hover:bg-blue-800'
            }`}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Try asking for products by description or category, e.g., "I need napkins and cups"
        </p>
      </div>
    </div>
  )
}

// Helper icons not imported above
const Plus = ({ className = "h-6 w-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const Check = ({ className = "h-6 w-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)