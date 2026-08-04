import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("📥 Helius Webhook Received Payload:", JSON.stringify(body).slice(0, 400));

    const transactions = Array.isArray(body) ? body : [body];

    for (const tx of transactions) {
      let mintAddress = null;

      // Extract mint from token transfers
      if (tx?.tokenTransfers && Array.isArray(tx.tokenTransfers) && tx.tokenTransfers.length > 0) {
        mintAddress = tx.tokenTransfers[0]?.mint;
      }

      // Extract mint from account data (SPL mint size 82)
      if (!mintAddress && tx?.accountData && Array.isArray(tx.accountData)) {
        const mintAcc = tx.accountData.find(acc => acc?.mint || acc?.space === 82);
        if (mintAcc) mintAddress = mintAcc.account || mintAcc.pubkey;
      }

      if (!mintAddress) {
        console.log("⚠️ Skipped transaction: No mint address extracted.");
        continue;
      }

      const tokenPayload = {
        mint: mintAddress,
        name: tx?.description ? tx.description.slice(0, 50) : "Pump.fun Token",
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
        console.error("❌ Supabase Webhook Insert Error:", error.message);
      } else {
        console.log(`✅ Successfully added live token: ${mintAddress}`);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("🔥 Helius Webhook Critical Exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "DEXLive Helius Webhook Active" }, { status: 200 });
}