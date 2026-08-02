export function VerificationReportCard({ gmgnText, dexText, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-end z-50 p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col h-full overflow-y-auto shadow-2xl">
        
        {/* Header & Close Button */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
          <h2 className="text-xl font-bold text-cyan-400">Deep-Dive AI Audit Report</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 px-3 py-1 rounded-lg text-sm"
          >
            ✕ Close
          </button>
        </div>

        {/* Report Content Grid */}
        <div className="space-y-6 flex-1">
          {/* GMGN Report View */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h3 className="text-base font-bold text-emerald-400 mb-2">🧠 GMGN Intelligence Report</h3>
            <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">{gmgnText}</pre>
          </div>

          {/* DEXScreener Report View */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h3 className="text-base font-bold text-cyan-400 mb-2">📈 DEXScreener Technical Report</h3>
            <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">{dexText}</pre>
          </div>
        </div>

      </div>
    </div>
  );
}