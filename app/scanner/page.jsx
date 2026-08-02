"use client";
import { useState } from 'react';
import RequireSubscription from "@/components/RequireSubscription";

export default function ScannerPage() {
  const [selectedStrategy, setSelectedStrategy] = useState('1_2x');
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [scanStatus, setScanStatus] = useState('IDLE'); // IDLE, RUNNING, FINISHED

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
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-emerald-400 mb-2">DexLive Momentum Control</h1>
            <p className="text-zinc-400 text-sm">
              Select your target strategy and execute institutional-grade scans with real-time hybrid verification.
            </p>
          </div>

          {/* TOP CONTROLS CARD: Strategy Selector + Single Run Button */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6 shadow-xl">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Select Target Strategy Option
            </label>
            
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <select
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                className="w-full bg-black border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition text-sm"
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
                className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-8 rounded-xl transition whitespace-nowrap disabled:opacity-50 text-sm shadow-lg shadow-emerald-500/10"
              >
                {isScanning ? "Running Analysis..." : "RUN ANALYSIS →"}
              </button>
            </div>
          </div>

          {/* LIVE PROCESS LOG (HYBRID PIPELINE) */}
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