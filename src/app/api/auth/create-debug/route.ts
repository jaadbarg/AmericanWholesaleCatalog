import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    console.log("=== DEBUG AUTH API ===");
    console.log("SUPABASE_SERVICE_ROLE_KEY exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log("SUPABASE_SERVICE_ROLE_KEY prefix:", process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) + "...");
    console.log("Admin client initialized:", !!adminSupabase);
    
    // Try a direct method to test service role permissions
    try {
      const testEmail = "testuser" + Date.now() + "@example.com";
      console.log("Attempting to create test user:", testEmail);
      
      const { data, error } = await adminSupabase.auth.admin.createUser({
        email: testEmail,
        password: "Welcome123!",
        email_confirm: true
      });
      
      if (error) {
        console.error("Error creating test user:", error);
        return NextResponse.json({ 
          success: false, 
          error: error.message,
          details: error 
        });
      }
      
      console.log("Successfully created test user:", data);
      return NextResponse.json({ 
        success: true, 
        message: "Test user created successfully",
        userId: data.user?.id,
        userEmail: data.user?.email 
      });
    } catch (e) {
      console.error("Exception during test user creation:", e);
      return NextResponse.json({ 
        success: false, 
        error: e instanceof Error ? e.message : "Unknown error",
        details: e
      });
    }
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 });
  }
}