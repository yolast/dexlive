"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ProScannerPage() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTokens() {
      try {
        const { data, error } = await supabase
          .from("tokens_history")
          .select("*")
          .order("created_timestamp", { ascending: false })
          .limit(50);

        if (!error && data) {
          setTokens(data);
        }
      } catch (err) {
        console.error("Error fetching tokens:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTokens();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchTokens, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            REAL-TIME MEMECOIN FEED
          </h1>
          <p className="text-xs text-slate-400">
            Auto-syncing from Pump.fun every 2 minutes with dead-coin checkpoints.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-full">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-emerald-400 font-semibold">Live Monitoring Active</span>
        </div>
      </div>

      {/* Tokens Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 font-semibold text-sm text-slate-300 flex justify-between items-center">
          <span>Ingested Tokens History</span>
          <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-400">
            {tokens.length} Active Records
          </span>
        </div>
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400"></div>
            <span className="text-xs">Loading token data from database...</span>
          </div>
        ) : tokens.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No tokens found yet. Wait for the next 2-minute cron ingestion sync or check your Supabase table.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Token Name</th>
                  <th className="p-3.5">Ticker</th>
                  <th className="p-3.5">Market Cap</th>
                  <th className="p-3.5">Mint Address</th>
                  <th className="p-3.5">Created Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tokens.map((token) => (
                  <tr key={token.mint} className="hover:bg-slate-900/60 transition">
                    <td className="p-3.5 font-bold text-white">{token.name}</td>
                    <td className="p-3.5 text-cyan-400 font-mono">${token.ticker}</td>
                    <td className="p-3.5 text-emerald-400 font-semibold">
                      ${Number(token.market_cap).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500 truncate max-w-[180px]">
                      {token.mint}
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {new Date(Number(token.created_timestamp)).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}