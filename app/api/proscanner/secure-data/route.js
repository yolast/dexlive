import { supabase } from "@/lib/supabase";
import { verifyProAccess } from "@/lib/auth"; // 1. Import the verifier

export async function GET(req) {
  try {
    // 2. Enforce access check at the start of the route
    const access = await verifyProAccess();
    if (!access.allowed) {
      return new Response(JSON.stringify({ success: false, error: "Access Denied. Premium subscription required." }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. Your normal ProScanner database query goes here (only runs if allowed)
    const { data, error } = await supabase
      .from('tokens_history')
      .select('*')
      .order('created_timestamp', { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);

    return new Response(JSON.stringify({ success: true, tokens: data }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}