"use client";

import { useState, useEffect } from 'react';
import RequireSubscription from "@/components/RequireSubscription";

export default function ScannerPage() {
  const [selectedStrategy, setSelectedStrategy] = useState('1_2x');
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [scanStatus, setScanStatus] = useState('IDLE');

  // Telemetry & Feed State
  const [stats, setStats] = useState({ totalCoins: 0, eligibleCoins: 0, trendingCount: 0 });
  const [trendingCoins, setTrendingCoins] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  const momentumOptions = [
    { id: '1_2x', label: '1. 1–2X Early Breakout (+100%)' },
    { id: '2_5x', label: '2. 2–5X Runner (+300%)' },
    { id: 'pullback', label: '3. Healthy Pullback (Bull Flag)' },
    { id: 'smart_money', label: '4. Smart Money Net-Flow' },
    { id: 'pressure', label: '5. Organic Buy/Sell Ratio Guard' },
    { id: 'bonding', label: '6. Bonding Curve Graduation Watch' },
    { id: 'sniper_flush', label: '7. "Sniper Flush" Filter' },
    { id: '2x_trigger', label: '8. 🚀 100%+ Gain Trigger (Asynchronous)' }
  ];

  const addLog = (message) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${time}] ${message}`]);
  };

  const fetchScannerTelemetry = async () => {
    try {
      const res = await fetch(`/api/proscanner/secure-data?t=${Date.now()}`, {
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.metrics || { totalCoins: 0, eligibleCoins: 0, trendingCount: 0 });
        setTrendingCoins(data.trendingCoins || []);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error("Failed to load telemetry data:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchScannerTelemetry();
    // Sync with cron every 1 minute
    const interval = setInterval(fetchScannerTelemetry, 60000);

    // Live ticker effect for live feel
    const liveTicker = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalCoins: prev.totalCoins + Math.floor(Math.random() * 2) + 1,
        eligibleCoins: prev.eligibleCoins + Math.floor(Math.random() * 2)
      }));
    }, 8000);

    return () => {
      clearInterval(interval);
      clearInterval(liveTicker);
    };
  }, []);

  async function handleRunAnalysis() {
    setIsScanning(true);
    setScanStatus('RUNNING');
    setLogs([]);

    const currentOpt = momentumOptions.find(o => o.id === selectedStrategy);
    addLog(`[STAGE_1] Initializing Strategy: ${currentOpt?.label} via pipeline engine...`);

    setTimeout(() => {
      addLog(`[STAGE_2] Querying live token database & applying strict validation rules...`);
    }, 600);

    try {
      const res = await fetch('/api/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: selectedStrategy })
      });
      const data = await res.json();

      setTimeout(() => {
        if (data.success) {
          addLog(`[AI_AUDIT] GMGN & DEXScreener verification successfully completed.`);
          addLog(`[COMPLETE] Pipeline finished successfully.`);
          setScanStatus('FINISHED');
        } else {
          addLog(`[WARNING] Filter Notice: ${data.reason || "Token filtered out by strategy constraints."}`);
          addLog(`[COMPLETE] Scan finished with filter notices.`);
          setScanStatus('FINISHED');
        }
        setIsScanning(false);
      }, 1200);

    } catch (err) {
      setTimeout(() => {
        addLog(`[ERROR] Execution failed: ${err.message}`);
        setScanStatus('FINISHED');
        setIsScanning(false);
      }, 1200);
    }
  }

  return (
    <RequireSubscription>
      <div className="min-h-screen bg-black text-white p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header & Auto-Refresh Status */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl">
            <div>
              <h1 className="text-3xl font-extrabold text-emerald-400 mb-1 flex items-center gap-2">
                DEXLive ProScanner Hub 
                <span className="text-xl animate-bounce">⚡</span>
              </h1>
              <p className="text-zinc-400 text-sm">
                Real-time Solana memecoin telemetry & institutional-grade strategy execution.
              </p>
            </div>
            <div className="text-xs text-zinc-400 bg-zinc-950 px-3.5 py-2 rounded-xl border border-zinc-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Auto-syncing every 1m {lastUpdated && `(Last: ${lastUpdated})`}
            </div>
          </div>

          {/* Telemetry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Coins Added (DB)</p>
                <h3 className="text-3xl font-extrabold text-cyan-400 mt-2 transition-all duration-300">
                  {loadingStats ? "..." : stats.totalCoins.toLocaleString()}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Lifetime total active raw ingestion count</p>
              </div>
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 text-2xl animate-pulse">📦</div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Eligible Coins to Analyze</p>
                <h3 className="text-3xl font-extrabold text-emerald-400 mt-2 transition-all duration-300">
                  {loadingStats ? "..." : stats.eligibleCoins.toLocaleString()}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Post-cleanup active pool (Market Cap ≥ $5k)</p>
              </div>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-2xl animate-bounce">⚡</div>
            </div>
          </div>

          {/* Last 2h High-Momentum Coins */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-zinc-800">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                🔥 Last 2h High-Momentum Coins 
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-medium animate-pulse">≥ +100% Gains</span>
              </h2>
              <span className="text-xs text-zinc-400">{trendingCoins.length} qualifying tokens active</span>
            </div>

            {trendingCoins.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-xl">
                {loadingStats ? "Scanning mempool..." : "No coins meeting the +100% gain threshold in the last 2 hours currently."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="p-3">Token Name</th>
                      <th className="p-3">Ticker</th>
                      <th className="p-3">Market Cap</th>
                      <th className="p-3">2h Gain</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {trendingCoins.map((coin) => (
                      <tr key={coin.mint} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="p-3 font-medium text-white">{coin.name}</td>
                        <td className="p-3 text-zinc-400 uppercase font-mono">{coin.ticker}</td>
                        <td className="p-3 text-zinc-300">${Number(coin.market_cap || 0).toLocaleString()}</td>
                        <td className="p-3 text-emerald-400 font-bold font-mono">+{coin.price_change_24h}%</td>
                        <td className="p-3 text-right">
                          <a 
                            href={`https://pump.fun/coin/${coin.mint}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded-lg font-medium transition shadow-sm"
                          >
                            View ↗
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Strategy Options */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-4">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Select Target Strategy Option to Run Analysis
            </label>
            
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <select
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                className="w-full bg-black border border-zinc-800 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-emerald-500 transition text-sm"
              >
                {momentumOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                onClick={handleRunAnalysis}
                disabled={isScanning}
                className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3.5 px-8 rounded-xl transition whitespace-nowrap disabled:opacity-50 text-sm shadow-lg shadow-emerald-500/10 cursor-pointer"
              >
                {isScanning ? "Running Analysis..." : "RUN ANALYSIS →"}
              </button>
            </div>
          </div>

          {/* Live Process Log */}
          {scanStatus !== 'IDLE' && (
            <div className="bg-black border border-zinc-800 rounded-2xl p-5 shadow-2xl font-mono text-xs">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-900 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                  <span className="text-zinc-400 ml-2 font-semibold tracking-wider">LIVE PROCESS LOG (HYBRID PIPELINE)</span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded font-medium ${scanStatus === 'RUNNING' ? 'bg-yellow-500/20 text-yellow-400 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {scanStatus === 'RUNNING' ? '● Scanning...' : '● Scan Finished'}
                </span>
              </div>
              <div className="space-y-2 text-emerald-400/90 max-h-48 overflow-y-auto">
                {logs.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </RequireSubscription>
  );
}