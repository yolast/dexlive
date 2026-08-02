"use client";
import { useState } from 'react';
import { VerificationReportCard } from "@/components/VerificationReportCard";

export default function MomentumDashboard() {
  const [reportData, setReportData] = useState(null);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [activeStrategy, setActiveStrategy] = useState('2x_trigger');

  // All 8 Momentum Options formatted for a 2-row layout grid
  const momentumOptions = [
    { id: '1_2x', label: '1. 1–2X Early Breakout' },
    { id: '2_5x', label: '2. 2–5X Momentum Runner' },
    { id: 'pullback', label: '3. Healthy Pullback (Bull Flag)' },
    { id: 'smart_money', label: '4. Smart Money Net-Flow' },
    { id: 'pressure', label: '5. Organic Buy/Sell Ratio' },
    { id: 'bonding', label: '6. Bonding Curve Watch' },
    { id: 'sniper_flush', label: '7. "Sniper Flush" Filter' },
    { id: '2x_trigger', label: '8. 🚀 100%+ Gain Trigger' }
  ];

  async function handleVerify(mint) {
    setLoadingVerify(true);
    try {
      const res = await fetch('/api/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mint })
      });
      const data = await res.json();
      if(data.success) {
        setReportData({ gmgn: data.gmgn, dex: data.dex });
      } else {
        alert("Verification notice: " + (data.reason || data.error));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to run audit.");
    } finally {
      setLoadingVerify(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-6">
      <div className="max-w-7xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-2 text-emerald-400">DexLive Momentum Suite</h1>
        <p className="text-slate-400 text-sm mb-6">Select a strategy from the grid below to filter tokens and execute institutional-grade AI audits.</p>
        
        {/* 8 Options Menu Splitted into 2 Rows (4 items per row, no sidebar) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {momentumOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setActiveStrategy(opt.id)}
              className={`p-4 rounded-xl text-left text-sm font-semibold transition border ${
                activeStrategy === opt.id 
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/10' 
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Active Strategy Content View */}
        <div className="mt-4">
          <h2 className="text-lg font-bold text-white mb-4">Active Strategy Results: <span className="text-emerald-400">{momentumOptions.find(o => o.id === activeStrategy)?.label}</span></h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-lg text-white">Sample Token ($SAMPLE)</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">+145% Gain</span>
                </div>
                <p className="text-sm text-slate-400 mb-6">Milestone trigger active. Ready for deep-dive validation audit.</p>
              </div>
              <button 
                onClick={() => handleVerify('sample_mint_address')}
                disabled={loadingVerify}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition disabled:opacity-50 text-sm shadow-md"
              >
                {loadingVerify ? "Running AI Audit..." : "Run AI Audit →"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-over Verification Report Card */}
      {reportData && (
        <VerificationReportCard 
          gmgnText={reportData.gmgn} 
          dexText={reportData.dex} 
          onClose={() => setReportData(null)} 
        />
      )}
    </div>
  );
}