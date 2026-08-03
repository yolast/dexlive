import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req) {
  try {
    console.log("Cron ingestion started via DexScreener profiles at:", new Date().toISOString());

    // 1. Fetch latest token profiles from DexScreener
    const profilesRes = await fetch("https://api.dexscreener.com/token-profiles/latest/v1", {
      headers: { "Accept": "application/json" },
      cache: 'no-store'
    });

    if (!profilesRes.ok) {
      return NextResponse.json({ success: false, error: `Failed to fetch token profiles: ${profilesRes.status}` }, { status: 200 });
    }

    const profiles = await profilesRes.json();
    if (!Array.isArray(profiles) || profiles.length === 0) {
      return NextResponse.json({ success: true, message: "No token profiles returned." }, { status: 200 });
    }

    // 2. Filter for Solana tokens and extract unique addresses (max 30 per batch)
    const solanaAddresses = profiles
      .filter(p => p.chainId === 'solana' && p.tokenAddress)
      .map(p => p.tokenAddress);

    const uniqueAddresses = [...new Set(solanaAddresses)].slice(0, 30);

    if (uniqueAddresses.length === 0) {
      return NextResponse.json({ success: true, message: "No Solana token addresses found in profiles." }, { status: 200 });
    }

    // 3. Fetch detailed pair info for these Solana addresses
    const addressesString = uniqueAddresses.join(',');
    const pairsRes = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${addressesString}`, {
      headers: { "Accept": "application/json" },
      cache: 'no-store'
    });

    if (!pairsRes.ok) {
      return NextResponse.json({ success: false, error: `Failed to fetch pair details: ${pairsRes.status}` }, { status: 200 });
    }

    const pairs = await pairsRes.json();
    if (!Array.isArray(pairs) || pairs.length === 0) {
      return NextResponse.json({ success: true, message: "No pairs found for the given addresses." }, { status: 200 });
    }

    let insertedCount = 0;

    // 4. Upsert into Supabase tokens_history
    for (const pair of pairs) {
      if (!pair.baseToken?.address) continue;

      const payload = {
        mint: pair.baseToken.address,
        name: pair.baseToken.name || "Unknown",
        symbol: pair.baseToken.symbol || "UNKNOWN",
        market_cap: pair.marketCap || pair.fdv || 0,
        price_change_24h: pair.priceChange?.h24 || 0,
        created_timestamp: pair.pairCreatedAt || Date.now()
      };

      const { error: upsertError } = await supabase
        .from('tokens_history')
        .upsert(payload, { onConflict: 'mint' });

      if (!upsertError) {
        insertedCount++;
      }
    }

    // 5. Database Cleanup: Purge tokens older than 45 mins with market cap < $3,000
    const cutoffTimeMs = Date.now() - (45 * 60 * 1000);
    await supabase
      .from('tokens_history')
      .delete()
      .lt('created_timestamp', cutoffTimeMs)
      .lt('market_cap', 3000);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully synchronized ${insertedCount} active Solana tokens via DexScreener profiles.`,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (err) {
    console.error("Cron Ingestion Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 200 });
  }
}