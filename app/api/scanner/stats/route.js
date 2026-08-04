import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // 1. Count total raw coins added this month
    const { count: totalCount, error: totalError } = await supabase
      .from("tokens_history")
      .select("*", { count: "exact", head: true })
      .gte("created_at", firstDayOfMonth);

    if (totalError) {
      console.error("Total monthly count error:", totalError.message);
    }

    // 2. Count eligible analyzed coins (passed dead-coin filters)
    const { count: eligibleCount, error: eligibleError } = await supabase
      .from("tokens_history")
      .select("*", { count: "exact", head: true })
      .gte("created_at", firstDayOfMonth)
      .or("market_cap.gte.5000,usd_market_cap.gte.5000");

    if (eligibleError) {
      console.error("Eligible count error:", eligibleError.message);
    }

    return NextResponse.json({
      totalMonthlyCoins: totalCount || 0,
      eligibleCoins: eligibleCount || 0,
    }, { status: 200 });
  } catch (err) {
    console.error("Scanner Stats API Exception:", err);
    return NextResponse.json({ totalMonthlyCoins: 0, eligibleCoins: 0 }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";