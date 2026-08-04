import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const body = await req.json();
    const transactions = Array.isArray(body) ? body : [body];

    for (const tx of transactions) {
      let mintAddress = null;

      // Method 1: Check standard token transfers
      if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
        mintAddress = tx.tokenTransfers[0].mint;
      }

      // Method 2: Check account data for SPL Mint accounts (size 82 bytes) or explicit mint field
      if (!mintAddress && tx.accountData) {
        const mintAcc = tx.accountData.find(acc => acc.mint || acc.space === 82);
        if (mintAcc) mintAddress = mintAcc.account || mintAcc.pubkey;
      }

      // Method 3: Check transaction instructions or event logs
      if (!mintAddress && tx.events?.nft) {
        mintAddress = tx.events.nft.mint;
      }

      if (!mintAddress) continue;

      const tokenPayload = {
        mint: mintAddress,
        name: tx.description ? tx.description.slice(0, 50) : "Pump.fun Token",
        symbol: "PUMP",
        created_timestamp: Date.now(),
        bonding_curve_progress: 0.0,
        market_cap: 0,
        usd_market_cap: 0,
        volume_24h: 0,
        unique_traders: 1,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("tokens_history")
        .upsert([tokenPayload], { onConflict: "mint" });

      if (error) {
        console.error("Supabase live ingestion error:", error.message);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Helius Webhook Exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "DEXLive Helius Webhook Active" }, { status: 200 });
}