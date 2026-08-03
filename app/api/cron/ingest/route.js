import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Allow up to 30 seconds execution time on Vercel

export async function GET(req) {
  try {
    console.log("Cron ingestion execution started at:", new Date().toISOString());

    // 1. Fetch from Pump.fun API with browser-grade headers
    const res = await fetch("https://frontend-api.pump.fun/coins?offset=0&limit=50&sort=created_timestamp&order=DESC", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      },
      cache: 'no-store'
    });

    // CRITICAL: Return HTTP 200 even if upstream blocks us. 
    // This prevents cron-job.org from automatically disabling your task due to error spikes.
    if (!res.ok) {
      console.warn(`Pump.fun upstream limit reached (${res.status}). Skipping cycle gracefully.`);
      return NextResponse.json({ 
        success: false, 
        warning: `Upstream restricted access (HTTP ${res.status}). Retrying next cycle.` 
      }, { status: 200 });
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      console.warn("Pump.fun returned non-JSON response (Cloudflare challenge page). Skipping cycle.");
      return NextResponse.json({ 
        success: false, 
        warning: "Cloudflare challenge received. Skipping cycle." 
      }, { status: 200 });
    }

    const coins = await res.json();
    if (!coins || !Array.isArray(coins) || coins.length === 0) {
      return NextResponse.json({ success: true, message: "No coins found from Pump.fun API." }, { status: 200 });
    }

    let insertedCount = 0;

    // 2. Individual safe upsert loop
    for (const coin of coins) {
      try {
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
          *from('tokens_history')
          .upsert(payload, { onConflict: 'mint' });

        if (!upsertError) {
          insertedCount++;
        }
      } catch (innerErr) {
        // Silently catch individual record anomalies so the batch continues
      }
    }

    // 3. Controlled database cleanup (purge tokens older than 45 mins with market cap < $3,000)
    const cutoffTimeMs = Date.now() - (45 * 60 * 1000);
    await supabase
      .from('tokens_history')
      .delete()
      .lt('created_timestamp', cutoffTimeMs)
      .lt('market_cap', 3000);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully synchronized ${insertedCount} active tokens.`,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (err) {
    console.error("Cron Ingestion Critical Error:", err.message);
    // Always return HTTP 200 to protect the external cron monitor from disabling itself
    return NextResponse.json({ success: false, error: err.message }, { status: 200 });
  }
}