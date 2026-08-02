import SidebarCounter from "@/components/SidebarCounter";

export default function ProScannerSidebar({ children }) {
  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between h-screen">
      {/* Top Navigation Links / Logo */}
      <div>
        <div className="p-4 text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
          DEXLIVE PRO
        </div>
        {/* Your navigation links here */}
      </div>

      {/* Bottom Sidebar Widget: Live Memecoin Count */}
      <div className="pb-4">
        <SidebarCounter />
      </div>
    </aside>
  );
}