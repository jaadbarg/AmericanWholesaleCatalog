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
    const { customerId } = await request.json();

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

    // Delete customer's products first
    const { error: deleteProductsError } = await adminSupabase
      .from('customer_products')
      .delete()
      .eq('customer_id', customerId);

    if (deleteProductsError) {
      return NextResponse.json(
        { error: `Failed to delete customer products: ${deleteProductsError.message}` },
        { status: 500 }
      );
    }

    // Delete customer record
    const { error: deleteCustomerError } = await adminSupabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (deleteCustomerError) {
      return NextResponse.json(
        { error: `Failed to delete customer: ${deleteCustomerError.message}` },
        { status: 500 }
      );
    }

    // Delete auth user (this also deletes the profile due to DB triggers/cascading)
    const { error: deleteAuthError } = await adminSupabase.auth.admin.deleteUser(customerId);

    if (deleteAuthError) {
      return NextResponse.json(
        { error: `Failed to delete auth user: ${deleteAuthError.message}` },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully"
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}