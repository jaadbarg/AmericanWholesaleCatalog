// src/app/api/ai/process-order/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { StateGraph } from '@langchain/langgraph'
import { z } from 'zod'

// Types for matching products
type Product = {
  id: string
  item_number: string
  description: string
  category: string | null
  customerNote?: string
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

// State type for our graph
type GraphState = {
  message: string
  customerId: string
  chatHistory: { role: string; content: string }[]
  customer: any
  products: Product[]
  orderHistory: any[]
  suggestedProducts: SuggestedProduct[]
  aiResponse: string
}

export async function POST(request: Request) {
  try {
    // Get request body
    const { message, customerId, chatHistory = [] } = await request.json();
    
    if (!message || !customerId) {
      return NextResponse.json(
        { error: 'Missing message or customerId' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Security check: Verify if the user is associated with the provided customerId
    const { data: profile } = await supabase
      .from('profiles')
      .select('customer_id')
      .eq('id', session.user.id)
      .single();
    
    if (!profile || profile.customer_id !== customerId) {
      return NextResponse.json(
        { error: 'Unauthorized access to customer data' },
        { status: 401 }
      );
    }
    
    // Get customer's products with notes
    const { data: customerProducts, error: customerProductsError } = await supabase
      .from('customer_products')
      .select('product_id, notes')
      .eq('customer_id', customerId);
    
    if (customerProductsError) {
      console.error('Error fetching customer products:', customerProductsError);
      return NextResponse.json(
        { error: 'Failed to fetch customer products' },
        { status: 500 }
      );
    }
    
    const productIds = customerProducts.map(cp => cp.product_id);
    
    // Get product details
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);
    
    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }
    
    // Combine products with their customer-specific notes
    const productsWithNotes = products.map(product => {
      const customerProduct = customerProducts.find(cp => cp.product_id === product.id);
      return {
        ...product,
        customerNote: customerProduct?.notes || ''
      };
    });
    
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
      .limit(3);
    
    if (ordersError) {
      console.error('Error fetching previous orders:', ordersError);
    }
    
    // Format previous orders for context
    const orderHistory = previousOrders?.map(order => {
      const items = order.order_items.map(item => {
        const product = productsWithNotes.find(p => p.id === item.product_id);
        return {
          item_number: product?.item_number || 'Unknown',
          description: product?.description || 'Unknown',
          quantity: item.quantity,
          customerNote: product?.customerNote || ''
        };
      });
      
      return {
        date: new Date(order.created_at).toLocaleDateString(),
        items
      };
    }) || [];
    
    // Now process with AI
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    
    if (!ANTHROPIC_API_KEY) {
      console.error('Missing Anthropic API key');
      // Fall back to local search if Claude API key is missing
      const fallbackProducts = findMatchingProducts(message, productsWithNotes);
      return NextResponse.json({
        aiResponse: `I found ${fallbackProducts.length} products that might match your request.`,
        suggestedProducts: fallbackProducts
      });
    }
    
    try {
      // Format products for Claude
      const productCatalog = productsWithNotes.map(product => ({
        id: product.id,
        item_number: product.item_number,
        description: product.description,
        category: product.category,
        customerNote: product.customerNote
      }));
      
      // Prepare system instructions
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

RESPONSE FORMAT INSTRUCTIONS:
1. Your entire response must be a SINGLE valid JSON object with exactly two properties:
   - "aiResponse": a string containing your full response
   - "suggestedProducts": an array of product objects (can be empty if no products to suggest)

2. Example format:
{
  "aiResponse": "Your complete and helpful response goes here with ALL requested information",
  "suggestedProducts": [
    {
      "id": "product-id-from-catalog",
      "item_number": "product-item-number",
      "description": "product description",
      "quantity": 1,
      "confidence": "high",
      "customerNote": "Include any customer-specific notes here if available"
    }
  ]
}

CRITICAL JSON FORMATTING RULES:
- Your COMPLETE response must be valid JSON parseable by JSON.parse()
- DO NOT include any text, explanations, or characters outside the JSON object
- DO NOT include backticks, markdown code blocks, or XML tags around the JSON
- Escape all quotes within strings using backslash: \\"
- If there are no relevant products, use an empty array: "suggestedProducts": []
- Make sure JSON object starts with { and ends with } and nothing else
- Never respond with just "Let me check" or similar phrases without providing the actual information`;
      
      // Prepare messages array for Claude
      const promptMessages = [];
      
      // Add previous chat history (if any)
      if (chatHistory && chatHistory.length > 0) {
        // Limit history to last 10 messages to avoid token limits
        const recentHistory = chatHistory.slice(-10);
        
        // Convert to Claude format
        for (let i = 0; i < recentHistory.length; i++) {
          const msg = recentHistory[i];
          promptMessages.push({
            role: msg.role,
            content: msg.content
          });
        }
      }
      
      // Add the current user message
      promptMessages.push({
        role: 'user',
        content: message
      });
      
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
          temperature: 0.0, // Zero temperature for most deterministic JSON responses
          top_p: 0.1, // Keep responses very focused
          messages: promptMessages,
          system: systemInstructions
        })
      });
      
      if (!claudeResponse.ok) {
        console.error(`Claude API error: ${await claudeResponse.text()}`);
        throw new Error(`Claude API error: ${claudeResponse.status}`);
      }
      
      const claudeResult = await claudeResponse.json();
      
      if (!claudeResult.content || !claudeResult.content[0] || !claudeResult.content[0].text) {
        throw new Error('Invalid response format from Claude API');
      }
      
      // Get response text and parse JSON
      const responseText = claudeResult.content[0].text.trim();
      console.log("Raw Claude response:", responseText);
      
      try {
        // Try to extract JSON using a more specific regex pattern
        const jsonPattern = /\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/;
        const jsonMatch = responseText.match(jsonPattern);
        
        if (jsonMatch) {
          try {
            const jsonText = jsonMatch[0].trim();
            console.log("Extracted JSON:", jsonText);
            const parsedResponse = JSON.parse(jsonText);
            
            return NextResponse.json({
              aiResponse: parsedResponse.aiResponse,
              suggestedProducts: parsedResponse.suggestedProducts || []
            });
          } catch (parseError) {
            console.error('Failed to parse extracted JSON:', parseError);
          }
        } else {
          console.error('Failed to extract valid JSON with regex');
        }
        
        // Try a simpler approach - find where a JSON object might begin and end
        try {
          // Find the first opening brace
          const openBraceIndex = responseText.indexOf('{');
          if (openBraceIndex !== -1) {
            // Count braces to find the matching closing brace
            let braceCount = 0;
            let closeBraceIndex = -1;
            
            for (let i = openBraceIndex; i < responseText.length; i++) {
              if (responseText[i] === '{') braceCount++;
              if (responseText[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                  closeBraceIndex = i;
                  break;
                }
              }
            }
            
            if (closeBraceIndex !== -1) {
              // Extract what should be a valid JSON object
              const possibleJson = responseText.substring(openBraceIndex, closeBraceIndex + 1);
              console.log("Manual JSON extraction attempt:", possibleJson);
              
              try {
                const parsedResponse = JSON.parse(possibleJson);
                return NextResponse.json({
                  aiResponse: parsedResponse.aiResponse || "Sorry, I couldn't understand that request.",
                  suggestedProducts: parsedResponse.suggestedProducts || []
                });
              } catch (err) {
                console.error("Failed manual JSON parsing:", err);
              }
            }
          }
        } catch (manualError) {
          console.error("Error in manual JSON extraction:", manualError);
        }
        
        // Last resort fallback
        let fallbackResponse = "I'm having trouble understanding your request right now. Could you please try rephrasing it or being more specific about which products you're looking for?";
        
        // Try to extract any plain text that might be useful
        const textMatches = responseText.match(/"aiResponse"\s*:\s*"([^"]+)"/);
        if (textMatches && textMatches[1]) {
          fallbackResponse = textMatches[1].replace(/\\"/g, '"');
        } else if (responseText.length < 300) {
          fallbackResponse = responseText;
        }
        
        return NextResponse.json({
          aiResponse: fallbackResponse,
          suggestedProducts: []
        });
      } catch (jsonParsingError) {
        console.error('All JSON parsing methods failed:', jsonParsingError);
        
        return NextResponse.json({
          aiResponse: "I'm having trouble processing your request. Could you try rephrasing your question?",
          suggestedProducts: []
        });
      }
    } catch (claudeError) {
      console.error('Error calling Claude API:', claudeError);
      
      return NextResponse.json({
        aiResponse: "I'm temporarily unable to process your request. Our team has been notified of this issue. In the meantime, please try describing the specific products you need, or browse the products page.",
        suggestedProducts: []
      });
    }
    
  } catch (error) {
    console.error('Unexpected error in AI processing:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Helper function to find matching products
function findMatchingProducts(text: string, products: any[]): SuggestedProduct[] {
  const query = text.toLowerCase();
  const words = query.split(/\s+/).filter(word => word.length > 3);
  
  // Check for quantity patterns like "5 boxes of napkins" or "napkins x 5"
  const quantityMatches = text.match(/(\d+)\s+(?:boxes|cases|packages?|packs?|bundles?|items?|pieces?|sets?|units?|pairs?|dozens?|rolls?|sheets?|bottles?|jars?|cans?|bags?|cartons?|containers?)\s+(?:of\s+)?(.+)/i) 
    || text.match(/(.+?)(?:\s+x\s+|\s*x\s*)(\d+)/i);
  
  let specificProduct: string | null = null;
  let specificQuantity: number | null = null;
  
  if (quantityMatches) {
    // First regex match: "5 boxes of napkins"
    if (quantityMatches[2]) {
      specificQuantity = parseInt(quantityMatches[1]);
      specificProduct = quantityMatches[2].toLowerCase();
    } 
    // Second regex match: "napkins x 5"
    else if (quantityMatches[1]) {
      specificQuantity = parseInt(quantityMatches[2]);
      specificProduct = quantityMatches[1].toLowerCase();
    }
  }
  
  return products
    .filter(product => {
      const desc = product.description.toLowerCase();
      const itemNum = product.item_number.toLowerCase();
      const category = product.category?.toLowerCase() || '';
      const note = product.customerNote?.toLowerCase() || '';
      
      // Direct match with specific product
      if (specificProduct && (
        desc.includes(specificProduct) || 
        itemNum.includes(specificProduct) ||
        category.includes(specificProduct) ||
        note.includes(specificProduct)
      )) {
        return true;
      }
      
      // Direct match with full query
      if (desc.includes(query) || 
          itemNum.includes(query) || 
          category.includes(query) ||
          note.includes(query)) {
        return true;
      }
      
      // Partial match on multiple words
      let matches = 0;
      for (const word of words) {
        if (desc.includes(word) || 
            category.includes(word) || 
            note.includes(word)) {
          matches++;
        }
      }
      return matches >= Math.ceil(words.length * 0.4); // Match at least 40% of the words
    })
    .map(product => {
      // Calculate confidence based on match quality
      const desc = product.description.toLowerCase();
      const category = product.category?.toLowerCase() || '';
      const note = product.customerNote?.toLowerCase() || '';
      let confidence: 'high' | 'medium' | 'low' = 'low';
      
      // Higher confidence if matches customer note
      if (note && query.split(' ').some(word => note.includes(word.toLowerCase()))) {
        confidence = 'high';
      } else if (specificProduct && (
          desc.includes(specificProduct) || 
          category.includes(specificProduct) ||
          note.includes(specificProduct)
        )) {
        confidence = 'high';
      } else if (desc.includes(query) || 
                category.includes(query) ||
                note.includes(query)) {
        confidence = 'high';
      } else if (words.some(word => desc.includes(word) || note.includes(word))) {
        confidence = 'medium';
      }
      
      return {
        id: product.id,
        item_number: product.item_number,
        description: product.description,
        quantity: specificQuantity || 1,
        category: product.category,
        customerNote: product.customerNote,
        confidence
      };
    })
    .slice(0, 8); // Limit to 8 suggestions
}