"use client";

import { useState } from "react";
import MomentumSidebar from "@/components/MomentumSidebar";
import Link from "next/link";

export default function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-extrabold text-emerald-400 tracking-wider text-lg font-mono">
            DexLive
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-xs font-mono text-zinc-400">
            <Link href="/scanner" className="hover:text-white transition">Scanner Dashboard</Link>
          </nav>
        </div>

        <div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500 text-emerald-400 px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950/20"
          >
            <span>⚡ Momentum Suite</span>
          </button>
        </div>
      </header>

      <MomentumSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
}