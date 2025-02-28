import { NextResponse } from "next/server";
import { createCustomerWithProducts } from "@/lib/supabase/client";

export async function POST(request: Request) {
  try {
    // Check for API key for authorization (optional - depends on your security needs)
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
    const { email, name, productIds = [] } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Missing required fields: email and name" },
        { status: 400 }
      );
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: `Email address "${email}" is invalid` },
        { status: 400 }
      );
    }

    // Call our helper function to create customer with auth user
    const result = await createCustomerWithProducts(
      { name, email },
      productIds
    );
    
    if (!result.success) {
      // Return any errors from the helper function
      return NextResponse.json(
        { error: result.message || "Failed to create customer" },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(result);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}