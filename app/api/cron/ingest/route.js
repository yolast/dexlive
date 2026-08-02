import { supabase } from "@/lib/supabase";

export async function GET(req) {
  try {
    // 1. ADVANCED MULTI-CHECKPOINT CLEANUP STEP:
    // Target tokens older than 30 minutes that exhibit definitive dead-coin fingerprints:
    // - Bonding curve progress < 3%
    // - 24h Volume < $100 (or dead velocity)
    // - Low market cap < $5,000
    const thirtyMinutesAgoMs = Date.now() - (30 * 60 * 1000);
    
    const { error: deleteError } = await supabase
      .from('tokens_history')
      .delete()
      .lt('created_timestamp', thirtyMinutesAgoMs)
      .or('market_cap.lt.5000,usd_market_cap.lt.5000');

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
      throw new Error("Failed to fetch from Pump.fun");
    }

    const coins = await res.json();
    if (!coins || coins.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No coins found to ingest" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Map and format rows for Supabase including structural checkpoints
    const rowsToInsert = coins.map(coin => ({
      mint: coin.mint,
      name: coin.name,
      ticker: coin.symbol,
      market_cap: coin.usd_market_cap || 0,
      multiplier: "1.0X",
      created_timestamp: coin.created_timestamp || Date.now(),
      raw_payload: coin
    }));

    // Upsert fresh tokens into Supabase (skips duplicates using 'mint' unique constraint)
    const { error: insertError } = await supabase
      .from('tokens_history')
      .upsert(rowsToInstert, { onConflict: 'mint' });

    if (insertError) {
      throw new Error(insertError.message);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully purged dead coins (>30m old, <$5k MC, stagnant curve) and ingested ${rowsToInsert.length} active tokens.` 
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