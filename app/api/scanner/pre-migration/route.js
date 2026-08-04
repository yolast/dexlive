import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { data: allTokens, error: fetchError } = await supabase
      .from('tokens_history')
      .select('*')
      .order('created_timestamp', { ascending: false });

    if (fetchError) {
      console.error("Stats API database error:", fetchError.message);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    const tokens = allTokens || [];
    const totalMonthlyCoins = tokens.length;

    // Filter eligible analysis candidates (passed dead-coin purge criteria)
    const eligibleCoins = tokens.filter(t => (t.market_cap || 0) >= 5000 || (t.bonding_curve || 0) > 3).length;

    // Filter trending coins (gainers >= 100%)
    const trendingCoins = tokens.filter(t => {
      const gain = t.price_change_24h || t.gain_percentage || 15;
      return gain >= 100;
    });

    return NextResponse.json({
      success: true,
      totalMonthlyCoins,
      eligibleCoins,
      trendingCoins
    });

  } catch (err) {
    console.error("Stats API Exception:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}