'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RequireSubscription from '@/components/RequireSubscription';

export default function PostMigrationHub() {
  const router = useRouter();
  const [tokens, setTokens] = useState([]);
  const [topPriority, setTopPriority] = useState([]);
  const [loading, setLoading] = useState(true);
  const [intervalSetting, setIntervalSetting] = useState(15);
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    const savedInterval = localStorage.getItem('dexlive_post_interval');
    if (savedInterval) {
      setIntervalSetting(parseInt(savedInterval, 10));
    }
  }, []);

  const fetchPostMigrationData = async () => {
    try {
      const res = await fetch('/api/scanner/post-migration');
      if (res.ok) {
        const data = await res.json();
        setTokens(data.tokens || []);
        setTopPriority(data.top_priority_a || []);
      }
    } catch (err) {
      console.error("Failed to fetch post-migration tokens:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostMigrationData();
    const pollInterval = setInterval(fetchPostMigrationData, intervalSetting * 60 * 1000);
    return () => clearInterval(pollInterval);
  }, [intervalSetting]);

  return (
    <RequireSubscription>
      <div className="min-h-screen bg-black text-emerald-400 p-6 md:p-10 font-mono">
        
        {/* Top Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center justify-between border-b border-emerald-900 pb-5">
            <div>
              <button 
                onClick={() => router.push('/proscanner')}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 mb-2 inline-flex items-center gap-1"
              >
                &lt; BACK TO PROSCANNER HUB
              </button>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                PHASE 02: POST-MIGRATION HUB (RAYDIUM DEX)
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Live hybrid pipeline inspection. Active scan interval: <strong className="text-emerald-400">{intervalSetting >= 60 ? `${intervalSetting / 60}H` : `${intervalSetting} MINUTES`}</strong>.
              </p>
            </div>
            <button
              onClick={fetchPostMigrationData}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-emerald-300 border border-emerald-900 rounded text-xs font-bold transition"
            >
              FORCE REFRESH 🔄
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* TOP 3 PRIORITY A RECOMMENDATIONS BANNER */}
          <div>
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">
              &gt; TOP_03_PRIORITY_A_CANDIDATES (POST-MIGRATION / BULL FLAGS)
            </h2>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-48 bg-slate-950 rounded-xl border border-emerald-900/60 animate-pulse"></div>
                ))}
              </div>
            ) : topPriority.length === 0 ? (
              <div className="bg-slate-950 border border-emerald-900/60 rounded-xl p-6 text-center text-slate-500 text-xs">
                Scanning Raydium pools for clean LP health and bull-flag setups...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topPriority.map((coin, idx) => (
                  <div key={coin.mint || idx} className="bg-slate-950 border border-emerald-500/50 rounded-xl p-5 shadow-[0_0_15px_rgba(16,185,129,0.15)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-emerald-500 text-black font-black text-[10px] px-3 py-0.5 rounded-bl uppercase">
                      PRIORITY A #{idx + 1}
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded bg-emerald-950 border border-emerald-800 flex items-center justify-center font-bold text-emerald-400 text-sm">
                        {coin.symbol ? coin.symbol.slice(0, 3) : 'DEX'}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{coin.name || 'Unknown Token'}</h3>
                        <p className="text-[10px] text-slate-500">${coin.symbol || 'SOL'}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300 mb-4 bg-black p-3 rounded border border-emerald-900/40">
                      <div className="flex justify-between">
                        <span className="text-slate-500">LP Health:</span>
                        <span className="font-bold text-emerald-400">{coin.lp_health}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Top 10 Concentration:</span>
                        <span className="font-bold text-emerald-300">{coin.top_holder_concentration}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">AI Score:</span>
                        <span className="font-bold text-white">{coin.ai_confidence_score}/100</span>
                      </div>
                    </div>

                    <a
                      href={coin.axiom_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs text-center rounded transition shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    >
                      ANALYZE 15S CHART & TRADE ON AXIOM ⚡
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ALL POST-MIGRATION CANDIDATES & LIVE PROCESS LOG */}
          <div className="bg-slate-950 border border-emerald-900/80 rounded-xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-emerald-900 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">&gt; LIVE_POST_MIGRATION_RAYDIUM_FEED</h3>
              <span className="text-xs text-emerald-400">{tokens.length} graduated pools active</span>
            </div>

            {loading ? (
              <div className="p-10 text-center text-slate-500 text-xs">Loading post-migration DEX telemetry...</div>
            ) : tokens.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-xs">No graduated post-migration tokens found.</div>
            ) : (
              <div className="divide-y divide-emerald-900/40">
                {tokens.map((token, index) => (
                  <div key={token.mint || index} className="p-5 hover:bg-slate-900/40 transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-emerald-950 border border-emerald-800 flex items-center justify-center font-bold text-emerald-400 text-sm">
                          {token.symbol ? token.symbol.slice(0, 3) : 'D'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{token.name || 'Unnamed'}</h4>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black text-emerald-400 border border-emerald-900">${token.symbol}</span>
                            {token.is_priority_a && (
                              <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500 text-black font-black uppercase">
                                PRIORITY A
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">Mint: {token.mint || token.token_address || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-6 text-xs">
                        <div>
                          <p className="text-[10px] text-slate-500">LP STATUS</p>
                          <p className="font-bold text-emerald-400 mt-0.5">{token.lp_health}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500">TOP 10 HOLDERS</p>
                          <p className="font-bold text-emerald-300 mt-0.5">{token.top_holder_concentration}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500">AI SCORE</p>
                          <p className="font-bold text-white mt-0.5">{token.ai_confidence_score}/100</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedLogId(expandedLogId === (token.mint || index) ? null : (token.mint || index))}
                            className="px-3 py-2 bg-black hover:bg-slate-900 text-emerald-400 font-bold rounded border border-emerald-800 transition text-[11px]"
                          >
                            {expandedLogId === (token.mint || index) ? 'HIDE LOG' : 'LIVE PROCESS LOG 🔍'}
                          </button>
                          
                          <a
                            href={token.axiom_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded transition text-[11px] shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                          >
                            AXIOM (15S) ⚡
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* LIVE PROCESS LOG (HYBRID PIPELINE) */}
                    {expandedLogId === (token.mint || index) && (
                      <div className="mt-4 pt-4 border-t border-emerald-900/60 bg-black rounded-lg p-4">
                        <h5 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-3">
                          &gt; HYBRID_PIPELINE_EXECUTION_LOG [RAYDIUM DEX + AI]
                        </h5>
                        <div className="space-y-2">
                          {token.pipeline_logs?.map((log, lIdx) => (
                            <div key={lIdx} className="flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded border border-emerald-900/40">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${
                                  log.status === 'PASSED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                                }`}></span>
                                <span className="font-bold text-white text-[11px]">{log.step}</span>
                              </div>
                              <span className="text-slate-400 text-[11px]">{log.detail}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                                log.status === 'PASSED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                              }`}>
                                {log.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </RequireSubscription>
  );
}