"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserButton, Show } from "@clerk/nextjs";
import Link from "next/link";

export default function ScannerPage() {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState("15"); // "15" for 2m-15m, "30" for 2m-30m

  const handleRunScan = () => {
    const from = "2";
    const to = timeframe; // 15 or 30
    router.push(`/list?from=${from}&to=${to}`);
  };

  return (
    <main className="min-h-screen bg-black text-white p-8 flex flex-col justify-between">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 max-w-4xl mx-auto w-full">
        <h1 className="text-xl font-bold text-emerald-400">DexLive Scanner Control</h1>
        <Show when="signed-in">
          <UserButton afterSignOutUrl="/" />
        </Show>
      </div>

      {/* Center Controls */}
      <div className="max-w-md mx-auto w-full bg-zinc-950 border border-zinc-800 p-8 rounded-2xl shadow-2xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Select Timeframe Window</h2>
          <p className="text-xs text-zinc-400 font-mono">Choose coin launch age criteria for systematic code filtering.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setTimeframe("15")}
            className={`py-4 px-4 rounded-xl font-mono text-sm font-bold border transition-all ${
              timeframe === "15"
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-950/50"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            2m – 15m Age
          </button>

          <button
            onClick={() => setTimeframe("30")}
            className={`py-4 px-4 rounded-xl font-mono text-sm font-bold border transition-all ${
              timeframe === "30"
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-950/50"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            2m – 30m Age
          </button>
        </div>

        <button
          onClick={handleRunScan}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold py-4 rounded-xl uppercase tracking-wider text-sm transition shadow-lg shadow-emerald-950/80"
        >
          Report RUN →
        </button>
      </div>

      <div className="text-center text-xs text-zinc-600 font-mono">
        DexLive AI Orchestrator • Hybrid Quant Engine v2.5
      </div>
    </main>
  );
}