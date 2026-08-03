import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req) {
  try {
    console.log("Cron multi-keyword ingestion started at:", new Date().toISOString());

    // Search across multiple popular memecoin keywords to ensure high coverage
    const keywords = ['SOL', 'pump', 'dog', 'AI'];
    let allPairs = [];

    for (const kw of keywords) {
      try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${kw}`, {
          headers: { "Accept": "application/json" },
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          if (data.pairs) {
            allPairs.push(...data.pairs);
          }
        }
      } catch (e) {
        console.error(`Search failed for keyword ${kw}:`, e);
      }
    }

    if (allPairs.length === 0) {
      return NextResponse.json({ success: true, message: "No pairs found from DexScreener search." }, { status: 200 });
    }

    let insertedCount = 0;

    for (const pair of allPairs) {
      // Filter strictly for Solana chain tokens with valid addresses and market cap
      if (pair.chainId?.toLowerCase() !== 'solana' || !pair.baseToken?.address) continue;

      const payload = {
        mint: pair.baseToken.address,
        name: pair.baseToken.name || "Unknown",
        ticker: pair.baseToken.symbol || "UNKNOWN",
        market_cap: pair.marketCap || pair.fdv || 0,
        // Prioritize 1h gain, fallback to 24h gain
        price_change_24h: pair.priceChange?.h1 || pair.priceChange?.h24 || 0,
        created_timestamp: pair.pairCreatedAt ? new Date(pair.pairCreatedAt).getTime() : Date.now(),
        liquidity_usd: pair.liquidity?.usd || 0,
        volume_h24: pair.volume?.h24 || 0,
        volume_h1: pair.volume?.h1 || 0,
        txns_h1_buys: pair.txns?.h1?.buys || 0,
        txns_h1_sells: pair.txns?.h1?.sells || 0,
        dex_url: pair.url || null,
        image_url: pair.info?.imageUrl || null
      };

      const { error: upsertError } = await supabase
        .from('tokens_history')
        .upsert(payload, { onConflict: 'mint' });

      if (!upsertError) {
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
      message: `Successfully synchronized ${insertedCount} Solana tokens across multi-keywords.`,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (err) {
    console.error("Cron Ingestion Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 200 });
  }
}