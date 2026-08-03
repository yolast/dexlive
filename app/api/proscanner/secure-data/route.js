import { supabase } from "@/lib/supabase";
import { verifyProAccess } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    // 1. Enforce access check at the start of the route
    const access = await verifyProAccess();
    if (!access.allowed) {
      return new Response(JSON.stringify({ success: false, error: "Access Denied. Premium subscription required." }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. Total Coins Tracked in DB (Concept 2)
    const { count: totalCoins, error: totalError } = await supabase
      .from('tokens_history')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw new Error(`Total coins count error: ${totalError.message}`);

    // 3. Eligible Coins Count - e.g., Market Cap >= $5,000 (Concept 2)
    const { count: eligibleCoins, error: eligibleError } = await supabase
      .from('tokens_history')
      .select('*', { count: 'exact', head: true })
      .gte('market_cap', 5000);

    if (eligibleError) throw new Error(`Eligible coins count error: ${eligibleError.message}`);

    // 4. Last 24 Hours Trending Coins - Gain >= 100%, negatives filtered out (Concept 3)
    const { data: trendingCoins, error: trendingError } = await supabase
      .from('tokens_history')
      .select('mint, name, symbol, market_cap, price_change_24h, created_timestamp')
      .gte('price_change_24h', 100)
      .order('price_change_24h', { ascending: false })
      .limit(10);

    if (trendingError) {
      console.warn("Trending fetch warning:", trendingError.message);
    }

    // 5. Main Token Feed for Strategy Analysis (Concept 1)
    const { data: tokens, error: tokensError } = await supabase
      .from('tokens_history')
      .select('*')
      .order('created_timestamp', { ascending: false })
      .limit(50);

    if (tokensError) throw new Error(`Tokens feed error: ${tokensError.message}`);

    // 6. Return unified payload
    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        totalCoins: totalCoins || 0,
        eligibleCoins: eligibleCoins || 0,
        trendingCount: trendingCoins?.length || 0
      },
      trendingCoins: trendingCoins || [],
      tokens: tokens || []
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("ProScanner API Error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}