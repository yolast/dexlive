"use client";
import SidebarCounter from "@/components/SidebarCounter";
import { useProAccess } from "@/hooks/useProAccess";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProScannerLayout({ children }) {
  const { hasAccess, loading } = useProAccess();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !hasAccess) {
      router.push("/subscription");
    }
  }, [hasAccess, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
        <span className="ml-3 text-slate-400">Verifying Pro Access...</span>
      </div>
    );
  }

  if (!hasAccess) return null;

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between h-screen shrink-0">
        <div>
          <div className="p-4 text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            DEXLIVE PRO
          </div>
          <div className="px-3 py-2 space-y-1 text-sm text-slate-400">
            <a href="/proscanner" className="block px-3 py-2 rounded-lg bg-slate-900 text-white font-medium">
              Live Scanner
            </a>
            <a href="/subscription" className="block px-3 py-2 rounded-lg hover:bg-slate-900/50 hover:text-white transition">
              Subscription
            </a>
          </div>
        </div>

        {/* Bottom Sidebar Widget: Live Memecoin Count */}
        <div className="pb-4">
          <SidebarCounter />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-950 p-6">
        {children}
      </main>
    </div>
  );
}