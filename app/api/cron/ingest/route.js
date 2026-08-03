import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req) {
  try {
    console.log("Cron Solana memecoin ingestion started at:", new Date().toISOString());

    const keywords = ['pump', 'SOL', 'dog', 'AI', 'memes'];
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
        console.error(`Search failed for ${kw}:`, e);
      }
    }

    let insertedCount = 0;
    const NATIVE_SOL_MINT = 'So11111111111111111111111111111111111111112';

    for (const pair of allPairs) {
      // STRICT SOLANA ONLY & EXCLUDE NATIVE SOL / WRAPPED SOL
      if (pair.chainId?.toLowerCase() !== 'solana') continue;
      if (!pair.baseToken?.address || pair.baseToken.address === NATIVE_SOL_MINT) continue;
      if (pair.baseToken.symbol?.toUpperCase() === 'SOL') continue; 

      const mcap = Number(pair.marketCap || pair.fdv || 0);
      
      // Target active memecoins ($3,000 to $20,000,000 market cap)
      if (mcap < 3000 || mcap > 20000000) continue;

      const rawPriceChange = pair.priceChange?.h1 ?? pair.priceChange?.h24 ?? 0;

      const payload = {
        mint: pair.baseToken.address,
        name: pair.baseToken.name || "Unknown",
        ticker: pair.baseToken.symbol || "UNKNOWN",
        market_cap: mcap,
        price_change_24h: Number(rawPriceChange),
        created_timestamp: pair.pairCreatedAt ? new Date(pair.pairCreatedAt).getTime() : Date.now(),
        liquidity_usd: Number(pair.liquidity?.usd || 0),
        volume_h24: Number(pair.volume?.h24 || 0),
        volume_h1: Number(pair.volume?.h1 || 0),
        txns_h1_buys: Number(pair.txns?.h1?.buys || 0),
        txns_h1_sells: Number(pair.txns?.h1?.sells || 0),
        dex_url: pair.url || `https://dexscreener.com/solana/${pair.baseToken.address}`,
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
      .lt('created_timestamp', cutoffTimeMs);

    return NextResponse.json({ 
      success: true, 
      inserted: insertedCount,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (err) {
    console.error("Cron Ingestion Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 200 });
  }
}