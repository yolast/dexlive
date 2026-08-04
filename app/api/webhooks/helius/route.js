import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const body = await req.json();

    // Helius webhooks can send an array of transactions or a single object payload
    const transactions = Array.isArray(body) ? body : [body];

    for (const tx of transactions) {
      // Extract mint address from token transfers or account changes
      const mintAddress = 
        tx.tokenTransfers?.[0]?.mint || 
        tx.accountData?.[0]?.account || 
        null;

      if (!mintAddress) continue;

      // Extract basic token telemetry from the payload description or metadata
      const tokenPayload = {
        mint: mintAddress,
        name: tx.description ? tx.description.slice(0, 50) : "Pump.fun Token",
        symbol: "PUMP",
        created_timestamp: Date.now(),
        bonding_curve_progress: 0.0, // Brand new launch starts at 0%
        market_cap: 0,
        usd_market_cap: 0,
        volume_24h: 0,
        unique_traders: 1,
        created_at: new Date().toISOString()
      };

      // Upsert into Supabase (Inserts new coins or updates metrics if the mint already exists)
      const { error } = await supabase
        .from("tokens_history")
        .upsert([tokenPayload], { onConflict: "mint" });

      if (error) {
        console.error("Supabase live webhook ingestion error:", error.message);
      }
    }

    return NextResponse.json({ success: true, processed: transactions.length }, { status: 200 });
  } catch (err) {
    console.error("Helius Webhook Processing Exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Optional: Handle GET requests to verify endpoint health
export async function GET() {
  return NextResponse.json({ status: "DEXLive Helius Webhook Endpoint Active" }, { status: 200 });
}