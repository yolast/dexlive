"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProScannerPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalMonthlyCoins: 0,
    eligibleCoins: 0,
    trendingCoins: []
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const [preInterval, setPreInterval] = useState(2); 
  const [postInterval, setPostInterval] = useState(15); 
  const [preCooldownTime, setPreCooldownTime] = useState(0);
  const [postCooldownTime, setPostCooldownTime] = useState(0);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/scanner/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to load scanner stats:", err);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, 120000);
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

  return (
    <div className="max-w-7xl mx-auto space-y-8 bg-gradient-to-br from-slate-950 via-gray-900 to-zinc-950 min-h-screen text-white p-4 md:p-8 font-mono">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-emerald-400">
            &gt; DEXLIVE_PROSCANNER_HUB //
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Hybrid pipeline intelligence powered by systematic Helius telemetry and AI risk scoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-700/50 shadow-lg">
            <span className="w-2 h-2 mr-2 rounded-full bg-emerald-400 animate-pulse"></span>
            CRON_SYNC: ACTIVE (2M)
          </span>
        </div>
      </div>

      {/* SECTION: SYSTEM TELEMETRY METRICS */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
          &gt; SYSTEM_TELEMETRY_METRICS //
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL_MONTHLY_COINS</p>
            <h3 className="text-3xl font-black text-white mt-1">
              {loadingStats ? '...' : stats.totalMonthlyCoins.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Raw mints captured in Supabase DB</p>
          </div>
          
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ELIGIBLE_CANDIDATES</p>
            <h3 className="text-3xl font-black text-emerald-400 mt-1">
              {loadingStats ? '...' : stats.eligibleCoins.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Passed multi-checkpoint dead-coin purge</p>
          </div>
          
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">24H_TRENDING (≥100%)</p>
            <h3 className="text-3xl font-black text-emerald-300 mt-1">
              {loadingStats ? '...' : stats.trendingCoins?.length || 0} Coins
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Filtered positive momentum</p>
          </div>
        </div>
      </div>

      {/* SECTION: SELECT PIPELINE HUB & INTERVAL COOLDOWN */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
          &gt; SELECT_PIPELINE_HUB //
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Pre-Migration Hub Card */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-6 shadow-2xl relative hover:border-emerald-500/50 transition">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 uppercase">
                PHASE_01: PRE-MIGRATION
              </span>
              <span className="text-xs text-slate-400">Pump.fun Bonding Curve</span>
            </div>

            <h3 className="text-xl font-black text-white mb-2">&gt; Pre-Migration Hub</h3>
            <p className="text-slate-300 text-xs mb-6">
              Catch ultra-early memecoins during bonding curve progress. Features live pipeline logs, sniper flush filters & smart money tracking.
            </p>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-4 mb-6">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                Optimal Scan Interval Cooldown
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 3, 4, 5].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setPreInterval(mins)}
                    className={`py-2 text-xs font-bold rounded border transition-all ${
                      preInterval === mins
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg font-black'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-emerald-500/50'
                    }`}
                  >
                    {mins}M
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                disabled={preCooldownTime > 0}
                onClick={() => handleLaunchHub('pre')}
                className={`flex-1 py-3 px-6 rounded font-black text-xs transition-all shadow-lg ${
                  preCooldownTime > 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 shadow-emerald-500/20'
                }`}
              >
                {preCooldownTime > 0 ? `LOCKED (${formatTime(preCooldownTime)})` : 'LAUNCH PRE-MIGRATION HUB 🚀'}
              </button>

              {preCooldownTime > 0 && (
                <button
                  onClick={() => handleResetCooldown('pre')}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded border border-slate-700 transition"
                >
                  RESET
                </button>
              )}
            </div>
          </div>

          {/* Post-Migration Hub Card */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-6 shadow-2xl relative hover:border-emerald-500/50 transition">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 uppercase">
                PHASE_02: POST-MIGRATION
              </span>
              <span className="text-xs text-slate-400">Raydium DEX Liquidity</span>
            </div>

            <h3 className="text-xl font-black text-white mb-2">&gt; Post-Migration Hub</h3>
            <p className="text-slate-300 text-xs mb-6">
              Trade lower-risk swing entries, healthy bull-flag pullbacks, live pipeline logs, and sustained runners with verified LP health.
            </p>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-4 mb-6">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                Optimal Scan Interval Cooldown
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[15, 20, 30, 60, 120].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setPostInterval(mins)}
                    className={`py-2 text-[11px] font-bold rounded border transition-all ${
                      postInterval === mins
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg font-black'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-emerald-500/50'
                    }`}
                  >
                    {mins >= 60 ? `${mins / 60}H` : `${mins}M`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                disabled={postCooldownTime > 0}
                onClick={() => handleLaunchHub('post')}
                className={`flex-1 py-3 px-6 rounded font-black text-xs transition-all shadow-lg ${
                  postCooldownTime > 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 shadow-emerald-500/20'
                }`}
              >
                {postCooldownTime > 0 ? `LOCKED (${formatTime(postCooldownTime)})` : 'LAUNCH POST-MIGRATION HUB 📈'}
              </button>

              {postCooldownTime > 0 && (
                <button
                  onClick={() => handleResetCooldown('post')}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded border border-slate-700 transition"
                >
                  RESET
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 pt-4 pb-2 flex flex-col sm:flex-row items-center justify-between text-xs">
        <p className="text-white font-medium">
          DEXLIVE.FUN // ProScanner Hybrid Pipeline & Telemetry Terminal
        </p>
        <p className="text-slate-300 font-mono mt-1 sm:mt-0">
          Status: <span className="text-emerald-400 font-bold">Operational</span>
        </p>
      </footer>

    </div>
  );
}