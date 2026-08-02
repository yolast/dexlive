import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-[#0a0a0a] py-8 px-6 text-zinc-400 text-xs mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <p>© Dexlive.fun 2026. All rights reserved.</p>
        </div>
        <div className="flex space-x-6">
          <Link href="/privacy" className="hover:text-emerald-400 transition">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-emerald-400 transition">Terms Of Service</Link>
          <Link href="/dmca" className="hover:text-emerald-400 transition">DMCA Policy</Link>
        </div>
      </div>
    </footer>
  );
}