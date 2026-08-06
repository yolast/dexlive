import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import ws from 'ws'; // Required for Node.js 20 WebSocket support
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(" Missing Supabase environment variables on OCI server.");
  process.exit(1);
}

// Pass the ws transport explicitly to satisfy Node.js 20 requirements
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function runIngestionAndCleanupPipeline() {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}]  Fetching fresh memecoins from Pump.fun...`);

    // 1. Fetch live coin data directly from Pump.fun's public endpoint
    const response = await fetch("https://frontend-api-v3.pump.fun/coins?offset=0&limit=50&sort=created_timestamp&order=DESC", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": "https://pump.fun/"
      },
      signal: AbortSignal.timeout(15000) 
    });

    if (!response.ok) {
      throw new Error(`Pump.fun HTTP error: ${response.status} ${response.statusText}`);
    }

    const coins = await response.json();
    if (!Array.isArray(coins)) {
      throw new Error("Invalid response format received from Pump.fun API");
    }

    let upsertedCount = 0;
    let newTokensCount = 0;

    // 2. Process and Upsert fresh tokens into Supabase tokens_history table
    for (const coin of coins) {
      if (!coin.mint) continue;

      // Check if token already exists in DB to count true new raw ingestions
      const { data: existing } = await supabase
        .from('tokens_history')
        .select('mint')
        .eq('mint', coin.mint)
        .maybeSingle();

      const isNew = !existing;

      const tokenData = {
        mint: coin.mint,
        name: coin.name || "Unknown",
        symbol: coin.symbol || "???",
        image_uri: coin.image_uri || coin.uri || "",
        created_timestamp: coin.created_timestamp || Date.now(),
        market_cap: coin.market_cap || 0,
        usd_market_cap: coin.usd_market_cap || coin.market_cap || 0,
        bonding_curve_progress: coin.complete ? 100 : (coin.bonding_curve_progress || 0),
        creator: coin.creator || "",
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('tokens_history')
        .upsert(tokenData, { onConflict: 'mint' });

      if (!error) {
        upsertedCount++;
        if (isNew) {
          newTokensCount++;
        }
      } else {
        console.error(` Supabase Upsert Failed for mint ${coin.mint}:`, error.message);
      }
    }

    console.log(` Successfully synced ${upsertedCount} tokens (${newTokensCount} new) to Supabase.`);

    // Increment cumulative monthly ingested stats tracker in system_stats table
    if (newTokensCount > 0) {
      const { data: statData } = await supabase
        .from('system_stats')
        .select('value')
        .eq('key', 'monthly_ingested_count')
        .maybeSingle();

      const currentVal = statData ? Number(statData.value) : 0;
      const newVal = currentVal + newTokensCount;

      await supabase
        .from('system_stats')
        .upsert({ 
          key: 'monthly_ingested_count', 
          value: newVal, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'key' });
    }

    // 3. Automated Multi-Checkpoint Dead-Coin & Rug-Pull Purge (Batch limited)
    const thirtyMinutesAgoMs = Date.now() - (30 * 60 * 1000);

    await supabase
      .from('tokens_history')
      .delete()
      .lt('created_timestamp', thirtyMinutesAgoMs)
      .or('market_cap.lt.5000,usd_market_cap.lt.5000')
      .limit(50);

    await supabase
      .from('tokens_history')
      .delete()
      .lt('usd_market_cap', 1000)
      .limit(50);

    console.log(" Dead-coins and rugged valuation tokens purged successfully.");

  } catch (err) {
    console.error(" Pipeline execution error:", err.message);
  }
}

// Startup execution & 15-second continuous safe loop
console.log(" DEXLive OCI High-Speed Worker Started (15S Interval Pipeline).");
runIngestionAndCleanupPipeline();
setInterval(runIngestionAndCleanupPipeline, 15000);
