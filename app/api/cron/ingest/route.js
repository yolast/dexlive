import { supabase } from "@/lib/supabase";

export async function GET(req) {
  try {
    // 1. ADVANCED MULTI-CHECKPOINT CLEANUP STEP:
    // Target tokens older than 30 minutes that exhibit definitive dead-coin fingerprints:
    // - Created > 30 minutes ago
    // - Market cap < $5,000
    const thirtyMinutesAgoMs = Date.now() - (30 * 60 * 1000);
    
    const { error: deleteError } = await supabase
      .from('tokens_history')
      .delete()
      .lt('created_timestamp', thirtyMinutesAgoMs)
      .lt('market_cap', 5000);

    if (deleteError) {
      console.warn("Cleanup warning:", deleteError.message);
    }

    // 2. INGESTION STEP: Fetch latest fresh coins from Pump.fun V3 API
    const res = await fetch("https://frontend-api-v3.pump.fun/coins?offset=0&limit=50&sort=created_timestamp&order=DESC", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": "https://pump.fun/",
        "Origin": "https://pump.fun"
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch from Pump.fun: ${res.statusText}`);
    }

    const coins = await res.json();
    if (!coins || !Array.isArray(coins) || coins.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No coins found to ingest from Pump.fun" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. MAP & FORMAT ROWS: Ensure correct schema mapping
    const rowsToInsert = coins.map(coin => ({
      mint: coin.mint,
      name: coin.name || "Unknown",
      ticker: coin.symbol || "UNKNOWN",
      market_cap: coin.usd_market_cap || coin.market_cap || 0,
      multiplier: "1.0X",
      created_timestamp: coin.created_timestamp || Date.now(),
      raw_payload: coin
    }));

    // 4. UPSERT STEP: Insert fresh tokens into Supabase (skips duplicates using 'mint' unique constraint)
    const { error: insertError } = await supabase
      .from('tokens_history')
      .upsert(rowsToInsert, { onConflict: 'mint' });

    if (insertError) {
      throw new Error(`Supabase Insert Error: ${insertError.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully cleaned dead coins and ingested ${rowsToInsert.length} active tokens from Pump.fun.` 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Cron Ingest & Cleanup Error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}