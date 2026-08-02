"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function SidebarCounter() {
  const [tokenCount, setTokenCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchTokenCount = async () => {
    try {
      const { count, error } = await supabase
        .from("tokens_history")
        .select("*", { count: "exact", head: true });

      if (!error && count !== null) {
        setTokenCount(count);
      }
    } catch (err) {
      console.error("Error fetching token count:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchTokenCount();

    // Poll every 30 seconds to keep live sync with background cron updates
    const interval = setInterval(fetchTokenCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 mx-3 my-2 bg-slate-900/80 border border-slate-800 rounded-xl shadow-inner">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Active Memecoins
        </span>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <div className="text-2xl font-bold text-white">
          {loading ? "..." : tokenCount.toLocaleString()}
        </div>
        <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
          Live DB
        </span>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">
        Synced with 2m ingestion & 30m purge cron
      </p>
    </div>
  );
}