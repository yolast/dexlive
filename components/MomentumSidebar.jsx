"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MomentumSidebar({ isOpen, onClose }) {
  const router = useRouter();
  
  // Momentum Suite States
  const [tier, setTier] = useState("1-2x"); // "1-2x" or "2-5x"
  const [enablePullback, setEnablePullback] = useState(true);
  const [enableSmartMoney, setEnableSmartMoney] = useState(true);
  const [enableOrganicRatio, setEnableOrganicRatio] = useState(true);
  const [enableGraduation, setEnableGraduation] = useState(false);
  const [enableSniperFlush, setEnableSniperFlush] = useState(true);
  const [enableVelocity, setEnableVelocity] = useState(true);

  if (!isOpen) return null;

  const handleApplyFilters = () => {
    const params = new URLSearchParams({
      tier,
      pullback: enablePullback,
      smartMoney: enableSmartMoney,
      organic: enableOrganicRatio,
      graduation: enableGraduation,
      sniperFlush: enableSniperFlush,
      velocity: enableVelocity,
    });
    router.push(`/list?${params.toString()}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-zinc-950 border-l border-zinc-800 p-6 flex flex-col justify-between h-full shadow-2xl overflow-y-auto">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
            <h2 className="text-lg font-bold text-emerald-400 font-mono tracking-wider">⚡ Momentum Suite Config</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white font-mono text-sm">✕ Close</button>
          </div>

          <div className="space-y-6">
            {/* Option 1: Momentum Tier Selector */}
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-2">1. Target Gainer Tier</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTier("1-2x")}
                  className={`py-2.5 px-4 rounded-lg font-mono text-xs font-bold border transition ${
                    tier === "1-2x" ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-400"
                  }`}
                >
                  1–2X Breakout (+100%)
                </button>
                <button
                  onClick={() => setTier("2-5x")}
                  className={`py-2.5 px-4 rounded-lg font-mono text-xs font-bold border transition ${
                    tier === "2-5x" ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-400"
                  }`}
                >
                  2–5X Runner (+300%)
                </button>
              </div>
            </div>

            {/* Options 2–7: Toggles */}
            <div className="space-y-3 pt-2 border-t border-zinc-900">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-3">Systematic Quant Filters</label>

              {[
                { id: "pullback", label: "2. Healthy Pullback (Bull Flag) Detector", val: enablePullback, set: setEnablePullback },
                { id: "smart", label: "3. Smart Money Net-Flow Tracking", val: enableSmartMoney, set: setEnableSmartMoney },
                { id: "organic", label: "4. Organic Buy/Sell Ratio Guard", val: enableOrganicRatio, set: setEnableOrganicRatio },
                { id: "grad", label: "5. Bonding Curve Graduation Watch (80-99%)", val: enableGraduation, set: setEnableGraduation },
                { id: "flush", label: "6. 'Sniper Flush' Filter (<5% remaining)", val: enableSniperFlush, set: setEnableSniperFlush },
                { id: "velocity", label: "7. Volume-to-Liquidity Velocity Ratio", val: enableVelocity, set: setEnableVelocity },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
                  <span className="text-xs text-zinc-300 font-mono pr-2">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={item.val}
                    onChange={(e) => item.set(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-6 border-t border-zinc-800">
          <button
            onClick={handleApplyFilters}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold py-3.5 rounded-xl uppercase tracking-wider text-xs transition shadow-lg shadow-emerald-950"
          >
            Run Momentum Scan →
          </button>
        </div>

      </div>
    </div>
  );
}