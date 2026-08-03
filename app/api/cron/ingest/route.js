import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Allow up to 30 seconds execution time

export async function GET(req) {
  try {
    console.log("Cron ingestion execution started at:", new Date().toISOString());

    // Fetch live Solana token pairs from DexScreener's public API (bypasses Pump.fun Cloudflare 530 blocks)
    const res = await fetch("https://api.dexscreener.com/latest/dex/search?q=solana", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json"
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `DexScreener API failed with status ${res.status}` }, { status: 200 });
    }

    const data = await res.json();
    const pairs = data.pairs || [];

    if (!Array.isArray(pairs) || pairs.length === 0) {
      return NextResponse.json({ success: true, message: "No pairs found from DexScreener." }, { status: 200 });
    }

    let insertedCount = 0;

    // Loop through pairs and upsert Solana tokens into Supabase
    for (const pair of pairs) {
      if (pair.chainId !== 'solana' || !pair.baseToken?.address) continue;

      const payload = {
        mint: pair.baseToken.address,
        name: pair.baseToken.name || "Unknown",
        symbol: pair.baseToken.symbol || "UNKNOWN",
        market_cap: pair.marketCap || pair.fdv || 0,
        price_change_24h: pair.priceChange?.h24 || 0,
        created_timestamp: Date.now()
      };

      const { error: upsertError } = await supabase
        .from('tokens_history')
        .upsert(payload, { onConflict: 'mint' });

      if (!upsertError) {
        insertedCount++;
      }
    }

    // Controlled database cleanup (purge tokens older than 45 mins with market cap < $3,000)
    const cutoffTimeMs = Date.now() - (45 * 60 * 1000);
    await supabase
      .from('tokens_history')
      .delete()
      .lt('created_timestamp', cutoffTimeMs)
      .lt('market_cap', 3000);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully synchronized ${insertedCount} active Solana tokens from DexScreener.`,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (err) {
    console.error("Cron Ingestion Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 200 });
  }
}