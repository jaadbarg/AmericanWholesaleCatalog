import { NextResponse } from "next/server";
import { adminSupabase, createCustomerWithProducts } from "@/lib/supabase/client";

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
    const { customerData, productIds = [] } = await request.json();

    if (!customerData || !customerData.name || !customerData.email) {
      return NextResponse.json(
        { success: false, message: "Missing required customer data fields" },
        { status: 400 }
      );
    }
    
    // We need adminSupabase for these operations
    if (!adminSupabase) {
      return NextResponse.json(
        { success: false, message: "Server misconfiguration - admin operations not available" },
        { status: 500 }
      );
    }

    // Create the customer with associated products
    const result = await createCustomerWithProducts(
      customerData,
      productIds
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || "Failed to create customer" },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Customer created successfully",
      customerId: result.customerId
    });
    
  } catch (error) {
    console.error("Unexpected error in import-customer API:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}