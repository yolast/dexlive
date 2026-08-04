import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req) {
  try {
    const thirtyMinutesAgoMs = Date.now() - (30 * 60 * 1000);

    // Remove dead/stagnant coins older than 30 minutes
    const { error: deleteError } = await supabase
      .from("tokens_history")
      .delete()
      .lt("created_timestamp", thirtyMinutesAgoMs)
      .or("market_cap.lt.5000,usd_market_cap.lt.5000");

    if (deleteError) {
      console.error("Cleanup error:", deleteError.message);
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Dead-coin cleanup completed successfully." }, { status: 200 });
  } catch (err) {
    console.error("Cleanup exception:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}