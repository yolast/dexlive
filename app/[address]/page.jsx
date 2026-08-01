"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CoinDetails() {
  const { address } = useParams();
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function runAiAnalysis() {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tokenAddress: address }),
        });
        const data = await res.json();
        setAnalysis(data.analysis || "No analysis returned.");
      } catch (err) {
        setAnalysis("Error: Failed to fetch AI analysis.");
      } finally {
        setLoading(false);
      }
    }

    if (address) runAiAnalysis();
  }, [address]);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-emerald-400">Token AI Analysis</h1>
            <p className="text-xs font-mono text-zinc-500 break-all">{address}</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`https://pump.fun/${address}`}
              target="_blank"
              rel="noreferrer"
              className="bg-zinc-900 border border-zinc-800 text-xs px-3 py-2 rounded text-zinc-300 hover:border-zinc-700 transition"
            >
              Open Pump.fun ↗
            </a>
            <Link
              href="/list"
              className="bg-zinc-900 border border-zinc-800 text-xs px-3 py-2 rounded text-zinc-300 hover:border-zinc-700 transition"
            >
              ← Back to List
            </Link>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-emerald-400 font-mono animate-pulse">
              🤖 Gemini AI is evaluating contract & liquidity metrics...
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-zinc-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {analysis}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}