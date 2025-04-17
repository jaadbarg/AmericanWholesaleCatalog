// src/app/api/ai/process-order/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Types for matching products
type Product = {
  id: string
  item_number: string
  description: string
  category: string | null
}

type SuggestedProduct = {
  id: string
  item_number: string
  description: string
  quantity: number
  category?: string | null
  confidence: 'high' | 'medium' | 'low'
}

export async function POST(request: Request) {
  try {
    // Get request body
    const { message, customerId, chatHistory = [] } = await request.json()
    
    if (!message || !customerId) {
      return NextResponse.json(
        { error: 'Missing message or customerId' },
        { status: 400 }
      )
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Security check: Verify if the user is associated with the provided customerId
    const { data: profile } = await supabase
      .from('profiles')
      .select('customer_id')
      .eq('id', session.user.id)
      .single()
    
    if (!profile || profile.customer_id !== customerId) {
      return NextResponse.json(
        { error: 'Unauthorized access to customer data' },
        { status: 403 }
      )
    }
    
    // Get customer's products with notes
    const { data: customerProducts, error: customerProductsError } = await supabase
      .from('customer_products')
      .select('product_id, notes')
      .eq('customer_id', customerId)
    
    if (customerProductsError) {
      console.error('Error fetching customer products:', customerProductsError)
      return NextResponse.json(
        { error: 'Failed to fetch customer products' },
        { status: 500 }
      )
    }
    
    const productIds = customerProducts.map(cp => cp.product_id)
    
    // Get product details
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)
    
    if (productsError) {
      console.error('Error fetching products:', productsError)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }
    
    // Combine products with their customer-specific notes
    const productsWithNotes = products.map(product => {
      const customerProduct = customerProducts.find(cp => cp.product_id === product.id)
      return {
        ...product,
        customerNote: customerProduct?.notes || ''
      }
    })
    
    // Process the message using Claude API
    // Get customer's previous orders for context
    const { data: previousOrders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        delivery_date,
        status,
        order_items (
          id, 
          quantity,
          product_id
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (ordersError) {
      console.error('Error fetching previous orders:', ordersError)
    }
    
    // Format products for Claude
    const productCatalog = productsWithNotes.map(product => ({
      id: product.id,
      item_number: product.item_number,
      description: product.description,
      category: product.category,
      customerNote: product.customerNote
    }))
    
    // Format previous orders for context
    const orderHistory = previousOrders?.map(order => {
      const items = order.order_items.map(item => {
        const product = productsWithNotes.find(p => p.id === item.product_id)
        return {
          item_number: product?.item_number || 'Unknown',
          description: product?.description || 'Unknown',
          quantity: item.quantity,
          customerNote: product?.customerNote || ''
        }
      })
      
      return {
        date: new Date(order.created_at).toLocaleDateString(),
        items
      }
    }) || []
    
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
    
    if (!ANTHROPIC_API_KEY) {
      console.error('Missing Anthropic API key')
      // Fall back to local search if Claude API key is missing
      const fallbackProducts = findMatchingProducts(message, productsWithNotes)
      return NextResponse.json({
        aiResponse: `I found ${fallbackProducts.length} products that might match your request.`,
        suggestedProducts: fallbackProducts
      })
    }
    
    console.log("Processing order with Claude API, input message:", message)
    try {
      // Call Claude API
      // Print chat history for debugging
    console.log("Chat history:", JSON.stringify(chatHistory))
    
    // Prepare messages array for Claude
    const promptMessages = []

      // We'll use system parameter directly in the API call, prepare base instructions here for context
      const systemInstructions = `You are an AI assistant for American Wholesalers, helping customers place orders for paper goods and restaurant supplies.
        
PRODUCT CATALOG:
${JSON.stringify(productCatalog, null, 2)}

${orderHistory.length > 0 ? `CUSTOMER'S RECENT ORDER HISTORY:
${JSON.stringify(orderHistory, null, 2)}` : ''}

Special Instructions:
- Pay close attention to the customerNote field for each product. These are custom notes the customer has added to help them remember specifics about their order preferences for this product.
- Use these notes to understand product preferences better - they may contain info about packaging, usage, delivery preferences, or substitution rules.
- If a customer mentions something vague that might relate to a note (e.g., "the usual napkins setup" or "my special cups"), check if any product notes provide context.
- If the customer asks for "the same as last time" or "my usual order", use their most recent order history to populate suggestedProducts.
- If they want to reorder but with modifications (e.g., "same as last time but double the napkins"), adjust quantities accordingly.
- If the customer mentions a product category rather than specific items, suggest the most relevant products from that category.
- Pay attention to quantity expressions like "5 boxes of napkins" or "napkins x5".
- If the customer asks for something not in the catalog, explain that you couldn't find it and suggest alternatives if appropriate.
- If the customer asks about their order history, provide a COMPLETE answer with all relevant information in a SINGLE response. DO NOT say "Let me check" or "One moment" without providing the actual information. Always include the full order details in your initial response.

CRITICAL: ALWAYS give a complete answer in a single response. Never respond with just acknowledgments like "Let me check" or "One moment please" - this breaks the user experience. If you need to look up information, include both the acknowledgment AND the complete information in the SAME response.

Always respond with valid JSON using this exact format:
{
  "aiResponse": "Your complete and helpful response goes here with ALL requested information",
  "suggestedProducts": [
    {
      "id": "product-id-from-catalog",
      "item_number": "product-item-number",
      "description": "product description",
      "quantity": 1,
      "confidence": "high"
    }
  ]
}

IMPORTANT: 
- Provide COMPLETE answers in ONE response
- Do not include any additional text outside the JSON
- If there are no relevant products, use an empty array for suggestedProducts
- Remember to escape quotes within the aiResponse string
- Never respond with just "Let me check" or similar phrases without providing all the requested information`

      // Add previous chat history (if any)
      if (chatHistory && chatHistory.length > 0) {
        // Limit history to last 10 messages to avoid token limits
        const recentHistory = chatHistory.slice(-10)
        
        // Convert to Claude format
        for (let i = 0; i < recentHistory.length; i++) {
          const msg = recentHistory[i]
          promptMessages.push({
            role: msg.role,
            content: msg.content
          })
        }
      }
      
      // Add the current user message
      promptMessages.push({
        role: 'user',
        content: message
      })
      
      // Make proper Claude API call
      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01' // Use latest API version
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 4000,
          temperature: 0.3, // Lower temperature for more predictable JSON responses
          messages: promptMessages,
          system: systemInstructions
        })
      })
      
      if (!claudeResponse.ok) {
        console.error(`Claude API error: ${await claudeResponse.text()}`)
        throw new Error(`Claude API error: ${claudeResponse.status}`)
      }
      
      const claudeResult = await claudeResponse.json()
      
      console.log("Claude API response received:", JSON.stringify(claudeResult))
      
      if (!claudeResult.content || !claudeResult.content[0] || !claudeResult.content[0].text) {
        throw new Error('Invalid response format from Claude API')
      }
      
      // Get response text and parse JSON
      const responseText = claudeResult.content[0].text.trim()
      console.log("Claude text response:", responseText)
      
      try {
        // First, try direct parsing - Claude 3 is usually good at following JSON instructions
        const parsedResponse = JSON.parse(responseText)
        
        // Return Claude's response with suggested products
        return NextResponse.json({
          aiResponse: parsedResponse.aiResponse,
          suggestedProducts: parsedResponse.suggestedProducts || []
        })
      } catch (jsonError) {
        console.error('Failed to parse Claude JSON response cleanly:', jsonError)
        
        // Try to extract JSON using regex as a fallback
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsedResponse = JSON.parse(jsonMatch[0])
            return NextResponse.json({
              aiResponse: parsedResponse.aiResponse,
              suggestedProducts: parsedResponse.suggestedProducts || []
            })
          }
        } catch (extractError) {
          console.error('Failed to extract JSON with regex:', extractError)
        }
        
        // If all parsing failed, log the raw response for debugging
        console.error('Raw Claude response:', responseText)
        
        // Use the text response directly if it's short enough, or extract a meaningful part
        let fallbackResponse = "I'm having trouble understanding your request right now. Could you please try rephrasing it or being more specific about which products you're looking for?"
        
        if (responseText.length > 0 && responseText.length < 300) {
          // If response is a reasonably sized text (not JSON), use it directly
          fallbackResponse = responseText
        } else if (responseText.length >= 300) {
          // Try to extract a meaningful response from the text
          const sentences = responseText.split(/[.!?]/)
          if (sentences.length > 0) {
            // Get the first few sentences if they're not too long
            const firstSentences = sentences.slice(0, 3).join('. ') + '.'
            if (firstSentences.length < 300) {
              fallbackResponse = firstSentences
            }
          }
        }
        
        return NextResponse.json({
          aiResponse: fallbackResponse,
          suggestedProducts: []
        })
      }
      
      // This code is unreachable - we return from inside the try/catch above
      // But removing it would require modifying the catch block to satisfy TypeScript
      
    } catch (error) {
      console.error('Error calling Claude API:', error)
      
      // Provide a more helpful error message
      return NextResponse.json({
        aiResponse: "I'm temporarily unable to process your request. Our team has been notified of this issue. In the meantime, please try describing the specific products you need, or browse the products page.",
        suggestedProducts: []
      })
    }
    
  } catch (error) {
    console.error('Unexpected error in AI processing:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// Helper function to find matching products
function findMatchingProducts(text: string, products: any[]): SuggestedProduct[] {
  const query = text.toLowerCase()
  const words = query.split(/\s+/).filter(word => word.length > 3)
  
  // Check for quantity patterns like "5 boxes of napkins" or "napkins x 5"
  const quantityMatches = text.match(/(\d+)\s+(?:boxes|cases|packages?|packs?|bundles?|items?|pieces?|sets?|units?|pairs?|dozens?|rolls?|sheets?|bottles?|jars?|cans?|bags?|cartons?|containers?)\s+(?:of\s+)?(.+)/i) 
    || text.match(/(.+?)(?:\s+x\s+|\s*x\s*)(\d+)/i)
  
  let specificProduct: string | null = null
  let specificQuantity: number | null = null
  
  if (quantityMatches) {
    // First regex match: "5 boxes of napkins"
    if (quantityMatches[2]) {
      specificQuantity = parseInt(quantityMatches[1])
      specificProduct = quantityMatches[2].toLowerCase()
    } 
    // Second regex match: "napkins x 5"
    else if (quantityMatches[1]) {
      specificQuantity = parseInt(quantityMatches[2])
      specificProduct = quantityMatches[1].toLowerCase()
    }
  }
  
  return products
    .filter(product => {
      const desc = product.description.toLowerCase()
      const itemNum = product.item_number.toLowerCase()
      const category = product.category?.toLowerCase() || ''
      const note = product.customerNote?.toLowerCase() || ''
      
      // Direct match with specific product
      if (specificProduct && (
        desc.includes(specificProduct) || 
        itemNum.includes(specificProduct) ||
        category.includes(specificProduct) ||
        note.includes(specificProduct)
      )) {
        return true
      }
      
      // Direct match with full query
      if (desc.includes(query) || 
          itemNum.includes(query) || 
          category.includes(query) ||
          note.includes(query)) {
        return true
      }
      
      // Partial match on multiple words
      let matches = 0
      for (const word of words) {
        if (desc.includes(word) || 
            category.includes(word) || 
            note.includes(word)) {
          matches++
        }
      }
      return matches >= Math.ceil(words.length * 0.4) // Match at least 40% of the words
    })
    .map(product => {
      // Calculate confidence based on match quality
      const desc = product.description.toLowerCase()
      const category = product.category?.toLowerCase() || ''
      const note = product.customerNote?.toLowerCase() || ''
      let confidence: 'high' | 'medium' | 'low' = 'low'
      
      // Higher confidence if matches customer note
      if (note && query.split(' ').some(word => note.includes(word.toLowerCase()))) {
        confidence = 'high'
      } else if (specificProduct && (
          desc.includes(specificProduct) || 
          category.includes(specificProduct) ||
          note.includes(specificProduct)
        )) {
        confidence = 'high'
      } else if (desc.includes(query) || 
                category.includes(query) ||
                note.includes(query)) {
        confidence = 'high'
      } else if (words.some(word => desc.includes(word) || note.includes(word))) {
        confidence = 'medium'
      }
      
      return {
        id: product.id,
        item_number: product.item_number,
        description: product.description,
        quantity: specificQuantity || 1,
        category: product.category,
        confidence,
        customerNote: product.customerNote
      }
    })
    .slice(0, 8) // Limit to 8 suggestions
}