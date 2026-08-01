"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

function ListPageContent() {
  const searchParams = useSearchParams();
  const fromMinutes = searchParams.get("from") || "2";
  const toMinutes = searchParams.get("to") || "15";

  const [logs, setLogs] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [reports, setReports] = useState(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    const eventSource = new EventSource(`/api/pipeline?from=${fromMinutes}&to=${toMinutes}`);

    eventSource.onmessage = (event) => {
      const parsedData = JSON.parse(event.data);
      const { step, message, data } = parsedData;

      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] [${step}] ${message}`]);

      if (step === "COMPLETE" || step === "ERROR") {
        if (data) setReports(data);
        setIsComplete(true);
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] [SYSTEM] Connection closed.`]);
      setIsComplete(true);
      eventSource.close();
    };

    return () => eventSource.close();
  }, [fromMinutes, toMinutes]);

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12 space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 max-w-6xl mx-auto w-full">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-400 tracking-tight">DexLive AI Orchestrator</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Active Scanning Timeframe: <span className="text-white font-mono">{fromMinutes}m to {toMinutes}m</span>
          </p>
        </div>
        <Link
          href="/scanner"
          className="text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-4 py-2.5 rounded-lg transition"
        >
          ← Cancel & New Search
        </Link>
      </div>

      {/* Prominent Live Process Log (Integrated on Main Screen) */}
      <div className="max-w-6xl mx-auto w-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-zinc-900/90 px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="ml-2 text-xs text-zinc-400 font-mono tracking-widest uppercase font-bold">Live Process Log (Hybrid Pipeline)</span>
          </div>
          <span className="text-xs font-mono text-emerald-400 animate-pulse">
            {isComplete ? "● Scan Finished" : "● Live Execution"}
          </span>
        </div>
        <div className="p-6 h-96 overflow-y-auto font-mono text-xs md:text-sm text-emerald-400 space-y-3 bg-black/80">
          {logs.map((log, index) => (
            <div key={index} className="leading-relaxed border-l-2 border-emerald-500/30 pl-3">{log}</div>
          ))}
          {!isComplete && (
            <div className="flex items-center text-zinc-500 mt-4 animate-pulse">
              <span>▋ Executing hybrid filters & AI sniper modules...</span>
            </div>
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Results & Final Output Section */}
      {isComplete && reports && (
        <div className="max-w-6xl mx-auto w-full space-y-8 animate-fade-in pb-20">
          
          {/* Status Headline */}
          <div className="text-center py-8 border-y border-zinc-800 bg-zinc-950/60 rounded-2xl shadow-inner">
            {reports.hasQualifiedCoins ? (
              <h2 className="text-3xl md:text-5xl font-black text-emerald-400 tracking-tight uppercase">
                Qualified Coins Found
              </h2>
            ) : (
              <h2 className="text-3xl md:text-5xl font-black text-amber-500 tracking-tight uppercase">
                No Qualified Coins Found
              </h2>
            )}
          </div>

          {/* Qualified Coins Grid/List */}
          {reports.hasQualifiedCoins && reports.qualifiedTokens?.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase text-emerald-400 tracking-wider">
                Top Verified Candidates
              </h3>
              <div className="grid gap-4">
                {reports.qualifiedTokens.map((token, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-950 border border-emerald-500/30 p-6 rounded-xl shadow-xl"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-white">{token.name}</span>
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-3 py-1 rounded border border-emerald-800 font-semibold">
                          ${token.ticker}
                        </span>
                        <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded">
                          Score: {token.score}/100
                        </span>
                      </div>
                      <p className="text-xs font-mono text-zinc-500 mt-2 break-all">
                        Mint Address: <span className="text-zinc-300">{token.address}</span>
                      </p>
                    </div>

                    <a 
                      href={token.dexUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-6 py-3 rounded-xl transition-all text-sm uppercase tracking-wider whitespace-nowrap shadow-lg shadow-emerald-950"
                    >
                      View on DEXScreener ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final Reports Section */}
          <div className="space-y-6 pt-4">
            <h3 className="text-2xl font-bold text-emerald-400 border-b border-zinc-800 pb-3">
              Final AI Analysis Report (DEX Technical Validation)
            </h3>
            
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-8 prose prose-invert prose-emerald max-w-none text-sm font-mono">
              <ReactMarkdown>{reports.dexReport}</ReactMarkdown>
            </div>
          </div>

        </div>
      )}
    </main>
  );
}

export default function ListPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">Initializing Hybrid Orchestrator...</div>}>
      <ListPageContent />
    </Suspense>
  );
}