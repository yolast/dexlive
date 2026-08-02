"use client";

import Link from "next/link";
import { UserButton, useUser, SignInButton } from "@clerk/nextjs";

export default function Navbar() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <nav className="border-b border-zinc-900 bg-black sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
      {/* Left: Logo */}
      <div className="flex items-center space-x-2">
        <Link href="/" className="text-xl font-extrabold text-emerald-400 tracking-wider flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          DexLive
        </Link>
      </div>

      {/* Right: Menu Items + Auth */}
      <div className="flex items-center space-x-8">
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/" className="text-zinc-400 hover:text-emerald-400 transition">Home</Link>
          <Link href="/scanner" className="text-zinc-400 hover:text-emerald-400 transition">Pro Scanner</Link>
          <Link href="/subscription" className="text-zinc-400 hover:text-emerald-400 transition">Pricing</Link>
          <Link href="/help" className="text-zinc-400 hover:text-emerald-400 transition">Help & Support</Link>
        </div>

        <div className="flex items-center space-x-4">
          {isLoaded && (
            <>
              {isSignedIn ? (
                <UserButton afterSignOutUrl="/" />
              ) : (
                <SignInButton mode="modal">
                  <button className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-emerald-500/10">
                    Sign In
                  </button>
                </SignInButton>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}