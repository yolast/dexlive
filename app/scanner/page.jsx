"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProScannerPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalMonthlyCoins: 0,
    eligibleCoins: 0,
  });
  const [momentumCoins, setMomentumCoins] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingMomentum, setLoadingMomentum] = useState(true);

  // Selected Hubs & Intervals
  const [preInterval, setPreInterval] = useState(2); 
  const [postInterval, setPostInterval] = useState(15); 
  const [preCooldownTime, setPreCooldownTime] = useState(0);
  const [postCooldownTime, setPostCooldownTime] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoadingStats(true);
        const res = await fetch(`/api/scanner/stats?t=${Date.now()}`, {
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to load scanner stats:", err);
      } finally {
        setLoadingStats(false);
      }

      try {
        setLoadingMomentum(true);
        // Fetch recent tokens from Supabase
        const { data: tokens, error } = await supabase
          .from("tokens_history")
          .select("*")
          .order("created_timestamp", { ascending: false })
          .limit(50);

        if (!error && tokens) {
          // Fallback: If strict 10m filter returns nothing, display the latest ingested tokens
          setMomentumCoins(tokens);
        }
      } catch (err) {
        console.error("Failed to load momentum tokens:", err);
      } finally {
        setLoadingMomentum(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 60000); // refresh every 1m
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setPreCooldownTime((prev) => (prev > 0 ? prev - 1 : 0));
      setPostCooldownTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLaunchHub = (hubType) => {
    if (hubType === 'pre') {
      if (preCooldownTime > 0) return;
      localStorage.setItem('dexlive_pre_interval', preInterval);
      setPreCooldownTime(preInterval * 60);
      router.push('/proscanner/pre-migration');
    } else {
      if (postCooldownTime > 0) return;
      localStorage.setItem('dexlive_post_interval', postInterval);
      setPostCooldownTime(postInterval * 60);
      router.push('/proscanner/post-migration');
    }
  };

  const handleResetCooldown = (hubType) => {
    if (hubType === 'pre') {
      setPreCooldownTime(0);
      localStorage.removeItem('dexlive_pre_interval');
    } else {
      setPostCooldownTime(0);
      localStorage.removeItem('dexlive_post_interval');
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatCoinAge = (timestamp) => {
    if (!timestamp) return 'Recent';
    const timeVal = Number(timestamp) || new Date(timestamp).getTime();
    const diffMs = Date.now() - timeVal;
    if (diffMs < 0 || isNaN(diffMs)) return 'Just now';
    const mins = Math.floor(diffMs / (60 * 1000));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ${mins % 60}m ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-8 font-mono">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header & Auto-Refresh Status */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-3xl font-extrabold text-emerald-400 mb-1">
              DEXLive ProScanner Hub
            </h1>
            <p className="text-zinc-400 text-sm">
              Real-time Solana memecoin telemetry & institutional-grade strategy execution.
            </p>
          </div>
          <div className="text-xs text-zinc-400 bg-zinc-950 px-3.5 py-2 rounded-xl border border-zinc-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Auto-syncing
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Monthly Coins Ingested</p>
              <h3 className="text-3xl font-extrabold text-cyan-400 mt-2 transition-all duration-300">
                {loadingStats ? '...' : stats.totalMonthlyCoins.toLocaleString()}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Total raw mints captured</p>
            </div>
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 text-2xl animate-pulse">📦</div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Eligible Analysis Candidates</p>
              <h3 className="text-3xl font-extrabold text-emerald-400 mt-2 transition-all duration-300">
                {loadingStats ? '...' : stats.eligibleCoins.toLocaleString()}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Passed multi-checkpoint dead-coin purge</p>
            </div>
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-2xl animate-bounce">⚡</div>
          </div>
        </div>

        {/* Select Trading Pipeline Hub Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-black tracking-wider text-emerald-400 uppercase">Select Trading Pipeline Hub</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 1. Pre-Migration Hub Card */}
            <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl relative hover:border-emerald-400 transition">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase tracking-widest">
                  Phase 1: Pre-Migration
                </span>
                <span className="text-xs text-zinc-400 font-mono">Pump.fun Bonding Curve</span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">Pre-Migration Hub</h3>
              <p className="text-zinc-400 text-xs mb-6 leading-relaxed">
                Catch ultra-early memecoins during bonding curve progress. Features sniper flush filters and smart money tracking.
              </p>

              <div className="bg-black border border-zinc-800 rounded-xl p-4 mb-6">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Optimal Scan Interval Cooldown
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 3, 4, 5].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setPreInterval(mins)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all font-mono ${
                        preInterval === mins
                          ? 'bg-emerald-500 text-black font-black border-emerald-400 shadow-md'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-emerald-500/50'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  disabled={preCooldownTime > 0}
                  onClick={() => handleLaunchHub('pre')}
                  className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-xs transition-all shadow-lg font-mono ${
                    preCooldownTime > 0
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/10'
                  }`}
                >
                  {preCooldownTime > 0 ? `Locked (${formatTime(preCooldownTime)})` : 'Launch Pre-Migration Hub 🚀'}
                </button>

                {preCooldownTime > 0 && (
                  <button
                    onClick={() => handleResetCooldown('pre')}
                    className="px-4 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-700 transition font-mono"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* 2. Post-Migration Hub Card */}
            <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-green-500/40 rounded-2xl p-6 shadow-2xl relative hover:border-green-400 transition">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded text-[10px] font-bold bg-green-500/20 text-green-400 uppercase tracking-widest">
                  Phase 2: Post-Migration
                </span>
                <span className="text-xs text-zinc-400 font-mono">Raydium DEX Liquidity</span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">Post-Migration Hub</h3>
              <p className="text-zinc-400 text-xs mb-6 leading-relaxed">
                Trade lower-risk swing entries, healthy bull-flag pullbacks, and sustained runners with verified LP health.
              </p>

              <div className="bg-black border border-zinc-800 rounded-xl p-4 mb-6">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Optimal Scan Interval Cooldown
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[15, 20, 30, 60, 120].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setPostInterval(mins)}
                      className={`py-2 text-[11px] font-bold rounded-lg border transition-all font-mono ${
                        postInterval === mins
                          ? 'bg-green-500 text-black font-black border-green-400 shadow-md'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-green-500/50'
                      }`}
                    >
                      {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  disabled={postCooldownTime > 0}
                  onClick={() => handleLaunchHub('post')}
                  className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-xs transition-all shadow-lg font-mono ${
                    postCooldownTime > 0
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                      : 'bg-green-500 hover:bg-green-400 text-black shadow-green-500/10'
                  }`}
                >
                  {postCooldownTime > 0 ? `Locked (${formatTime(postCooldownTime)})` : 'Launch Post-Migration Hub 📈'}
                </button>

                {postCooldownTime > 0 && (
                  <button
                    onClick={() => handleResetCooldown('post')}
                    className="px-4 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-700 transition font-mono"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* 🔥 Live Ingested Memecoins Section */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-zinc-800">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              🔥 Live Ingested Memecoins Feed
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-medium animate-pulse">Real-Time DB Stream</span>
            </h2>
            <span className="text-xs text-zinc-400">{momentumCoins.length} active tokens</span>
          </div>

          {loadingMomentum ? (
            <div className="text-center py-12 text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400"></div>
              <span>Loading tokens from Supabase...</span>
            </div>
          ) : momentumCoins.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-xl">
              No tokens found in database. Waiting for Helius webhook influx...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-xs">
                  <tr>
                    <th className="p-3">Token Name</th>
                    <th className="p-3">Ticker</th>
                    <th className="p-3">Market Cap</th>
                    <th className="p-3">Coin Age</th>
                    <th className="p-3">Gain</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {momentumCoins.map((coin, index) => {
                    const mint = coin.mint || coin.token_address || coin.address || '';
                    const gainVal = coin.price_change_24h || coin.gain_percentage || 0;
                    const axiomUrl = mint 
                      ? `https://axiom.trade/trade/${mint}` 
                      : 'https://axiom.trade';

                    return (
                      <tr key={mint || index} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="p-3 font-medium text-white">{coin.name || 'Unknown'}</td>
                        <td className="p-3 text-zinc-400 uppercase font-mono">{coin.ticker || coin.symbol || 'MEME'}</td>
                        <td className="p-3 text-zinc-300">${Number(coin.market_cap || coin.usd_market_cap || 0).toLocaleString()}</td>
                        <td className="p-3 text-cyan-400 text-xs">{formatCoinAge(coin.created_timestamp || coin.created_at)}</td>
                        <td className="p-3 font-bold font-mono text-emerald-400">
                          {gainVal >= 0 ? `+${gainVal}%` : `${gainVal}%`}
                        </td>
                        <td className="p-3 text-right">
                          <a 
                            href={axiomUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs rounded-lg font-bold transition shadow-sm inline-flex items-center gap-1"
                          >
                            Axiom ↗
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}