import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Fast count queries using head: true (zero data transfer overhead)
    const { count: totalCount } = await supabase
      .from("tokens_history")
      .select("*", { count: "exact", head: true })
      .gte("created_at", firstDayOfMonth);

    const { count: eligibleCount } = await supabase
      .from("tokens_history")
      .select("*", { count: "exact", head: true })
      .gte("created_at", firstDayOfMonth)
      .or("market_cap.gte.5000,usd_market_cap.gte.5000");

    return NextResponse.json({
      totalMonthlyCoins: totalCount || 0,
      eligibleCoins: eligibleCount || 0,
    }, { status: 200 });
  } catch (err) {
    console.error("Scanner Stats API Error:", err);
    return NextResponse.json({ totalMonthlyCoins: 0, eligibleCoins: 0 }, { status: 200 });
  }
}

export const dynamic = "force-dynamic";