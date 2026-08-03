import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req) {
  try {
    console.log("Cron ingestion started at:", new Date().toISOString());

    // Fetch live Solana pairs from DexScreener search API
    const res = await fetch("https://api.dexscreener.com/latest/dex/search?q=SOL", {
      headers: { "Accept": "application/json" },
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `DexScreener API failed with status ${res.status}` }, { status: 200 });
    }

    const data = await res.json();
    const pairs = data.pairs || (Array.isArray(data) ? data : []);

    if (!Array.isArray(pairs) || pairs.length === 0) {
      return NextResponse.json({ success: true, message: "API returned 0 pairs." }, { status: 200 });
    }

    let insertedCount = 0;
    let errors = [];

    for (const pair of pairs) {
      if (pair.chainId?.toLowerCase() !== 'solana' || !pair.baseToken?.address) continue;

      const payload = {
        mint: pair.baseToken.address,
        name: pair.baseToken.name || "Unknown",
        ticker: pair.baseToken.symbol || "UNKNOWN",
        market_cap: Number(pair.marketCap || pair.fdv || 0),
        price_change_24h: Number(pair.priceChange?.h1 || pair.priceChange?.h24 || 0),
        created_timestamp: Date.now(), // Force current millisecond timestamp so it's always fresh
        liquidity_usd: Number(pair.liquidity?.usd || 0),
        volume_h24: Number(pair.volume?.h24 || 0),
        volume_h1: Number(pair.volume?.h1 || 0),
        txns_h1_buys: Number(pair.txns?.h1?.buys || 0),
        txns_h1_sells: Number(pair.txns?.h1?.sells || 0),
        dex_url: pair.url || null,
        image_url: pair.info?.imageUrl || null
      };

      const { error: upsertError } = await supabase
        .from('tokens_history')
        .upsert(payload, { onConflict: 'mint' });

      if (upsertError) {
        errors.push(upsertError.message);
      } else {
        insertedCount++;
      }
    }

    // Database Cleanup: Purge tokens older than 45 mins with market cap < $3,000
    const cutoffTimeMs = Date.now() - (45 * 60 * 1000);
    await supabase
      .from('tokens_history')
      .delete()
      .lt('created_timestamp', cutoffTimeMs)
      .lt('market_cap', 3000);

    return NextResponse.json({ 
      success: true, 
      inserted: insertedCount,
      totalPairsFetched: pairs.length,
      errors: errors.length > 0 ? errors.slice(0, 5) : null,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (err) {
    console.error("Cron Ingestion Crash:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 200 });
  }
}