import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/client";

export async function POST(request: Request) {
  try {
    // Check for API key for authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - Missing or invalid API key" },
        { status: 401 }
      );
    }

    // Validate API key
    const apiKey = authHeader.split("Bearer ")[1];
    const validApiKey = process.env.ADMIN_API_KEY || "test-api-key";
    
    if (apiKey !== validApiKey) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid API key" },
        { status: 401 }
      );
    }

    // Get the request body
    const { customerId, customerName, customerEmail, productsToAdd = [], productsToRemove = [] } = await request.json();

    if (!customerId) {
      return NextResponse.json(
        { error: "Missing required field: customerId" },
        { status: 400 }
      );
    }
    
    // We need adminSupabase for these operations
    if (!adminSupabase) {
      return NextResponse.json(
        { error: "Server misconfiguration - admin operations not available" },
        { status: 500 }
      );
    }

    // Update customer information if provided
    if (customerName || customerEmail) {
      const updateData: Record<string, any> = {};
      if (customerName) updateData.name = customerName;
      if (customerEmail) updateData.email = customerEmail;
      updateData.updated_at = new Date().toISOString();

      const { error: updateError } = await adminSupabase
        .from('customers')
        .update(updateData)
        .eq('id', customerId);

      if (updateError) {
        return NextResponse.json(
          { error: `Failed to update customer: ${updateError.message}` },
          { status: 500 }
        );
      }
    }

    // Add products if needed
    if (productsToAdd.length > 0) {
      const customerProductsToAdd = productsToAdd.map(productId => ({
        customer_id: customerId,
        product_id: productId,
        created_at: new Date().toISOString()
      }));

      const { error: addError } = await adminSupabase
        .from('customer_products')
        .insert(customerProductsToAdd);

      if (addError) {
        return NextResponse.json(
          { error: `Failed to add products: ${addError.message}` },
          { status: 500 }
        );
      }
    }

    // Remove products if needed
    if (productsToRemove.length > 0) {
      const { error: removeError } = await adminSupabase
        .from('customer_products')
        .delete()
        .eq('customer_id', customerId)
        .in('product_id', productsToRemove);

      if (removeError) {
        return NextResponse.json(
          { error: `Failed to remove products: ${removeError.message}` },
          { status: 500 }
        );
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Customer updated successfully"
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}