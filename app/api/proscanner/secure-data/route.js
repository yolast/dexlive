import { supabase } from "@/lib/supabase";
import { verifyProAccess } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req) {
  try {
    const access = await verifyProAccess();
    if (!access.allowed) {
      return new Response(JSON.stringify({ success: false, error: "Access Denied. Premium subscription required." }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { count: totalCoins, error: totalError } = await supabase
      .from('tokens_history')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw new Error(totalError.message);

    const { count: eligibleCoins, error: eligibleError } = await supabase
      .from('tokens_history')
      .select('*', { count: 'exact', head: true })
      .gte('market_cap', 5000);

    if (eligibleError) throw new Error(eligibleError.message);

    // Fetch top momentum coins from the last 2 hours, sorted by highest gains
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    const { data: trendingCoins, error: trendingError } = await supabase
      .from('tokens_history')
      .select('mint, name, ticker, market_cap, price_change_24h, created_timestamp')
      .gte('created_timestamp', twoHoursAgo)
      .order('price_change_24h', { ascending: false })
      .limit(10);

    if (trendingError) {
      console.warn("Trending fetch warning:", trendingError.message);
    }

    const { data: tokens, error: tokensError } = await supabase
      .from('tokens_history')
      .select('*')
      .order('created_timestamp', { ascending: false })
      .limit(50);

    if (tokensError) throw new Error(tokensError.message);

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
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });

  } catch (err) {
    console.error("ProScanner API Error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}