import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req) {
  try {
    console.log("Cron momentum ingestion started at:", new Date().toISOString());

    // Fetch active boosted/trending tokens from DexScreener
    const res = await fetch("https://api.dexscreener.com/token-boosts/latest/v1", {
      headers: { "Accept": "application/json" },
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `API failed with status ${res.status}` }, { status: 200 });
    }

    const boosts = await res.json();
    if (!Array.isArray(boosts) || boosts.length === 0) {
      return NextResponse.json({ success: true, message: "No boost tokens returned." }, { status: 200 });
    }

    // Filter strictly for Solana chain tokens
    const solanaTokens = boosts.filter(b => b.chainId?.toLowerCase() === 'solana');
    
    if (solanaTokens.length === 0) {
      return NextResponse.json({ success: true, message: "No Solana boost tokens found." }, { status: 200 });
    }

    // Extract addresses to fetch detailed pair metrics
    const addresses = solanaTokens.slice(0, 30).map(b => b.tokenAddress).join(',');
    const pairsRes = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${addresses}`, {
      headers: { "Accept": "application/json" },
      cache: 'no-store'
    });

    if (!pairsRes.ok) {
      return NextResponse.json({ success: false, error: "Failed to fetch pair details." }, { status: 200 });
    }

    const pairs = await pairsRes.json();
    if (!Array.isArray(pairs) || pairs.length === 0) {
      return NextResponse.json({ success: true, message: "No pair details returned." }, { status: 200 });
    }

    let insertedCount = 0;

    for (const pair of pairs) {
      if (!pair.baseToken?.address) continue;

      const payload = {
        mint: pair.baseToken.address,
        name: pair.baseToken.name || "Unknown",
        ticker: pair.baseToken.symbol || "UNKNOWN",
        market_cap: pair.marketCap || pair.fdv || 0,
        // Capture 1h price change to match DexScreener 1h gainers view
        price_change_24h: pair.priceChange?.h1 || pair.priceChange?.h24 || 0,
        created_timestamp: pair.pairCreatedAt || Date.now(),
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
      message: `Successfully synchronized ${insertedCount} trending Solana tokens.`,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (err) {
    console.error("Cron Ingestion Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 200 });
  }
}