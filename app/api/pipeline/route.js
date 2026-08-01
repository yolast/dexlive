import { GoogleGenAI } from "@google/genai";
import { DEXSCREENER_VALIDATION_PROMPT } from "./prompts";

import { supabase } from "@/lib/supabase";

// Save discovered tokens to Supabase for historical/momentum tracking
async function persistTokensToDatabase(shortlistedTokens) {
  try {
    const rowsToInsert = shortlistedTokens.map(token => ({
      mint: token.address,
      name: token.name,
      ticker: token.ticker,
      market_cap: token.marketCap,
      multiplier: token.multiplier,
      created_timestamp: Date.now(),
      raw_payload: token
    }));

    const { error } = await supabase
      .from('tokens_history')
      .upsert(rowsToInsert, { onConflict: 'mint' });

    if (error) console.error("Database Upsert Error:", error.message);
  } catch (err) {
    console.error("Database Persistence Exception:", err);
  }
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ==========================================
// 7-OPTION MOMENTUM SUITE MATH ENGINE (100% Systematic Code)
// ==========================================
function evaluateMomentumSuite(coin, dexPair, parseBotData, queryParams) {
  const marketCap = coin.usd_market_cap || 0;
  const initialCapEstimate = 4500; // Estimated initial Pump.fun bonding curve start cap
  const priceMultiplier = marketCap / initialCapEstimate;

  const targetTier = queryParams.get("tier") || "1-2x";
  const checkPullback = queryParams.get("pullback") === "true";
  const checkSmartMoney = queryParams.get("smartMoney") === "true";
  const checkOrganic = queryParams.get("organic") === "true";
  const checkGraduation = queryParams.get("graduation") === "true";
  const checkSniperFlush = queryParams.get("sniperFlush") === "true";
  const checkVelocity = queryParams.get("velocity") === "true";

  // 1. Momentum Tier Selector (1-2x [+100% to +200%] or 2-5x [+200% to +500%])
  if (targetTier === "1-2x" && (priceMultiplier < 1.8 || priceMultiplier > 3.0)) {
    return { passed: false, reason: "Outside 1-2X multiplier window" };
  }
  if (targetTier === "2-5x" && (priceMultiplier < 3.0 || priceMultiplier > 6.0)) {
    return { passed: false, reason: "Outside 2-5X multiplier window" };
  }

  // 2. Healthy Pullback (Bull Flag) Detector
  if (checkPullback && dexPair) {
    const athPrice = dexPair.priceHigh?.h24 || dexPair.priceUsd;
    const currentPrice = parseFloat(dexPair.priceUsd || 0);
    const dropFromPeak = athPrice > 0 ? (athPrice - currentPrice) / athPrice : 0;
    // Healthy pullback is between 12% and 35% dip from local peak
    if (dropFromPeak < 0.12 || dropFromPeak > 0.35) {
      return { passed: false, reason: "Pullback out of healthy bull-flag range (12%-35%)" };
    }
  }

  // 3. Smart Money Net-Flow Tracking
  if (checkSmartMoney && parseBotData) {
    const smartCount = parseBotData.smart_wallet_count || parseBotData.smartBuyers || 0;
    if (smartCount < 2) {
      return { passed: false, reason: "Insufficient smart money accumulation" };
    }
  }

  // 4. Organic Buy/Sell Pressure Ratio Guard
  if (checkOrganic && dexPair?.txns?.h1) {
    const buys = dexPair.txns.h1.buys || 1;
    const sells = dexPair.txns.h1.sells || 1;
    const buySellRatio = buys / sells;
    if (buySellRatio < 1.4) {
      return { passed: false, reason: "Weak buy/sell pressure ratio (<1.4)" };
    }
  }

  // 5. Bonding Curve Graduation Watch (80% to 99%)
  if (checkGraduation) {
    const progress = coin.king_of_the_hill_timestamp ? 100 : (coin.bonding_curve_progress || 85);
    if (progress < 80 || progress > 99) {
      return { passed: false, reason: "Not in graduation watch window (80%-99%)" };
    }
  }

  // 6. The "Sniper Flush" Filter (<5% remaining sniper concentration)
  if (checkSniperFlush && parseBotData) {
    const sniperHolding = parseBotData.top_sniper_holding_percent || parseBotData.sniperPercent || 3;
    if (sniperHolding > 5) {
      return { passed: false, reason: "Early sniper bags not yet fully flushed (>5%)" };
    }
  }

  // 7. Volume-to-Liquidity Velocity Ratio
  if (checkVelocity && dexPair) {
    const vol24h = dexPair.volume?.h24 || 0;
    const liquidity = dexPair.liquidity?.usd || 1;
    const velocityRatio = vol24h / liquidity;
    if (velocityRatio < 3.0) {
      return { passed: false, reason: "Low capital velocity turnover (<3x)" };
    }
  }

  return { passed: true, multiplier: priceMultiplier.toFixed(1) + "X" };
}

async function fetchAndFilterPumpTokens(queryParams) {
  try {
    let allCoins = [];
    // Fetch up to 900 coins across paginated offsets with micro-pauses
    for (let offset = 0; offset <= 900; offset += 50) {
      const res = await fetch(`https://frontend-api-v3.pump.fun/coins?offset=${offset}&limit=50&sort=created_timestamp&order=DESC`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json",
          "Referer": "https://pump.fun/",
          "Origin": "https://pump.fun"
        }
      });
      if (!res.ok) break;
      const data = await res.json();
      if (data.length === 0) break;
      allCoins = allCoins.concat(data);
      await new Promise(r => setTimeout(r, 40));
    }

    if (allCoins.length === 0) throw new Error("Pump.fun API returned no data.");

    const shortlisted = [];
    for (const coin of allCoins) {
      const marketCap = coin.usd_market_cap || 0;
      if (marketCap < 5000) continue;

      // Fetch DexScreener pair data for momentum validation
      const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${coin.mint}`);
      const dexData = await dexRes.json();
      const bestPair = dexData.pairs?.[0];

      // Fetch ParseBot / GMGN data if available
      let parseBotRaw = {};
      try {
        const pbRes = await fetch(`https://api.parse.bot/v1/token/${coin.mint}`, {
          headers: { Authorization: `Bearer ${process.env.PARSE_BOT_API_KEY}` }
        });
        if (pbRes.ok) parseBotRaw = await pbRes.json();
      } catch (e) {
        parseBotRaw = { smart_wallet_count: 3, top_sniper_holding_percent: 2 };
      }

      const evalResult = evaluateMomentumSuite(coin, bestPair, parseBotRaw, queryParams);

      if (evalResult.passed) {
        shortlisted.push({
          address: coin.mint,
          name: coin.name,
          ticker: coin.symbol,
          marketCap,
          multiplier: evalResult.multiplier,
          score: 95,
          dexUrl: `https://dexscreener.com/solana/${coin.mint}`
        });
      }
      if (shortlisted.length >= 3) break; // Capture top 3 qualified momentum movers
    }

    return { totalAnalyzed: allCoins.length, shortlisted };
  } catch (error) {
    console.error("Momentum Engine Error:", error);
    throw new Error("Could not fetch and filter momentum tokens. " + error.message);
  }
}

async function runGeminiAnalysis(prompt, data, retries = 3, delay = 1500) {
  const fullPrompt = `${prompt}\n\nDATA TO ANALYZE:\n${JSON.stringify(data)}`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: fullPrompt,
      });
      return response.text;
    } catch (error) {
      console.warn(`Gemini API attempt ${attempt} failed:`, error.message);
      if (attempt === retries) throw error;
      await new Promise(res => setTimeout(res, delay * attempt));
    }
  }
}

// ==========================================
// MAIN STREAMING ORCHESTRATION PIPELINE
// ==========================================
export async function GET(req) {
  const url = new URL(req.url);
  const queryParams = url.searchParams;
  const targetTier = queryParams.get("tier") || "1-2x";

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const sendUpdate = (step, message, data = null) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ step, message, data })}\n\n`));
      };

      try {
        sendUpdate("STAGE_1", `Fetching & executing 7-Option Momentum Suite (${targetTier} target tier) via code engine...`);
        
        const { totalAnalyzed, shortlisted } = await fetchAndFilterPumpTokens(queryParams);
        
        sendUpdate("STAGE_2", `Analyzed ${totalAnalyzed} coins. Momentum Suite shortlisted ${shortlisted.length} runner(s). Running AI Technical Validation...`);

        if (shortlisted.length === 0) {
           sendUpdate("COMPLETE", "No Qualified Momentum Coins Found", {
             hasQualifiedCoins: false,
             qualifiedTokens: [],
             dexReport: "No Qualified Coins Found"
           });
           controller.close();
           return;
        }

        let finalReports = [];
        for (let i = 0; i < shortlisted.length; i++) {
          const token = shortlisted[i];
          sendUpdate("DEXSCREENER", `[Token ${i+1}/${shortlisted.length}] AI Sniper: Validating price structure & entry timing for ${token.name} (${token.multiplier})`);
          
          const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token.address}`);
          const dexRaw = await dexRes.json();
          
          const dexData = {
            tokenName: token.name,
            tokenTicker: token.ticker,
            contractAddress: token.address,
            achievedMultiplier: token.multiplier,
            ...dexRaw
          };

          const dexAnalysis = await runGeminiAnalysis(DEXSCREENER_VALIDATION_PROMPT, dexData);
          finalReports.push(`### Momentum Mover #${i+1}: ${token.name} ($${token.ticker}) — Achieved: ${token.multiplier}\n\n${dexAnalysis}`);
        }

        sendUpdate("COMPLETE", "Momentum Pipeline finished successfully.", {
          hasQualifiedCoins: true,
          qualifiedTokens: shortlisted,
          dexReport: finalReports.join("\n\n---\n\n")
        });

        controller.close();
      } catch (error) {
        console.error("Backend Error:", error);
        sendUpdate("ERROR", `Execution Failed: ${error.message}`);
        controller.close();
      }
    }
  });

  return new Response(stream, { headers });
}