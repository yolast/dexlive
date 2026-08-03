import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    console.log("Cron ingestion started at:", new Date().toISOString());

    // 1. Fetch fresh tokens from Pump.fun with explicit cache-busting headers
    const res = await fetch("https://frontend-api.pump.fun/coins?offset=0&limit=100&sort=created_timestamp&order=DESC", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Cache-Control": "no-cache"
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`Pump.fun API failed with status ${res.status}`);
    }

    const coins = await res.json();
    if (!coins || !Array.isArray(coins) || coins.length === 0) {
      return NextResponse.json({ success: true, message: "No coins returned from Pump.fun API." });
    }

    let insertedCount = 0;

    // 2. Loop and upsert records into Supabase tokens_history
    for (const coin of coins) {
      if (!coin.mint) continue;

      const payload = {
        mint: coin.mint,
        name: coin.name || "Unknown",
        symbol: coin.symbol || "UNKNOWN",
        market_cap: coin.usd_market_cap || coin.market_cap || 0,
        price_change_24h: coin.price_change_24h || 0,
        created_timestamp: coin.created_timestamp || Date.now()
      };

      const { error: upsertError } = await supabase
        .from('tokens_history')
        .upsert(payload, { onConflict: 'mint' });

      if (!upsertError) {
        insertedCount++;
      } else {
        console.error(`Supabase upsert error for ${coin.mint}:`, upsertError.message);
      }
    }

    // 3. Controlled Cleanup: Remove dead tokens older than 45 minutes with low market cap
    const cutoffTimeMs = Date.now() - (45 * 60 * 1000);
    const { error: deleteError } = await supabase
      .from('tokens_history')
      .delete()
      .lt('created_timestamp', cutoffTimeMs)
      .lt('market_cap', 3000);

    if (deleteError) {
      console.warn("Cleanup warning:", deleteError.message);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed and synchronized ${insertedCount} tokens.`,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("Cron Ingestion Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}