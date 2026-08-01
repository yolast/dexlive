import { supabase } from "@/lib/supabase";

export async function GET(req) {
  try {
    // Fetch latest fresh coins from Pump.fun
    const res = await fetch("https://frontend-api-v3.pump.fun/coins?offset=0&limit=50&sort=created_timestamp&order=DESC", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": "https://pump.fun/",
        "Origin": "https://pump.fun"
      }
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ success: false, error: "Failed to fetch from Pump.fun" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const coins = await res.json();
    if (!coins || coins.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No coins found" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Map and format rows for Supabase
    const rowsToInsert = coins.map(coin => ({
      mint: coin.mint,
      name: coin.name,
      ticker: coin.symbol,
      market_cap: coin.usd_market_cap || 0,
      multiplier: "1.0X",
      created_timestamp: coin.created_timestamp || Date.now(),
      raw_payload: coin
    }));

    // Upsert into Supabase (skips duplicates automatically using 'mint' unique constraint)
    const { error } = await supabase
      .from('tokens_history')
      .upsert(rowsToInsert, { onConflict: 'mint' });

    if (error) {
      throw new Error(error.message);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully ingested ${rowsToInsert.length} tokens into Supabase.` 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Cron Ingest Error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}