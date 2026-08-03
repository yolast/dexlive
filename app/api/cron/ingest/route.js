import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req) {
  try {
    console.log("Cron analytical ingestion started at:", new Date().toISOString());

    const res = await fetch("https://api.dexscreener.com/latest/dex/search?q=SOL", {
      headers: { "Accept": "application/json" },
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `API failed with status ${res.status}` }, { status: 200 });
    }

    const data = await res.json();
    const pairs = data.pairs || (Array.isArray(data) ? data : []);

    if (!Array.isArray(pairs) || pairs.length === 0) {
      return NextResponse.json({ success: true, message: "No pairs returned from DexScreener API." }, { status: 200 });
    }

    let insertedCount = 0;

    for (const pair of pairs) {
      if (pair.chainId?.toLowerCase() !== 'solana' || !pair.baseToken?.address) continue;

      const payload = {
        mint: pair.baseToken.address,
        name: pair.baseToken.name || "Unknown",
        ticker: pair.baseToken.symbol || "UNKNOWN",
        market_cap: pair.marketCap || pair.fdv || 0,
        price_change_24h: pair.priceChange?.h24 || pair.priceChange?.h1 || 0,
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

    const cutoffTimeMs = Date.now() - (45 * 60 * 1000);
    await supabase
      .from('tokens_history')
      .delete()
      .lt('created_timestamp', cutoffTimeMs)
      .lt('market_cap', 3000);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully synchronized ${insertedCount} tokens with real market data.`,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (err) {
    console.error("Cron Ingestion Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 200 });
  }
}