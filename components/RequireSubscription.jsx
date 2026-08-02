"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RequireSubscription({ children }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-400 text-sm">
        Verifying subscription access...
      </div>
    );
  }

  if (!user) {
    router.push("/");
    return null;
  }

  const metadata = user.publicMetadata || {};
  const expiry = metadata.subscriptionExpiry;
  const isExpired = !expiry || new Date(expiry) < new Date();

  if (isExpired) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-zinc-900/80 border border-red-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <span className="bg-red-500/10 text-red-400 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Access Restricted
          </span>
          <h2 className="text-2xl font-extrabold mt-4 text-white">Subscription Expired</h2>
          <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
            Your 7-day free trial or active subscription pass has expired. Renew your plan to instantly regain access to the Pro Scanner and momentum analytics suites.
          </p>
          <button
            onClick={() => router.push("/subscription?expired=true")}
            className="mt-8 w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3 rounded-xl transition text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10"
          >
            Renew Subscription Now →
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}