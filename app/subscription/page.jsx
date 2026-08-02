"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function SubscriptionPage() {
  const { user } = useUser();
  const [loadingTier, setLoadingTier] = useState(null);
  const [isExpiredNotice, setIsExpiredNotice] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("expired") === "true") {
        setIsExpiredNotice(true);
      }
    }
  }, []);

  const handleSolanaPay = async (tierName, solAmount) => {
    try {
      if (!window.solana && !window.phantom) {
        alert("Please install Phantom or a Solana wallet extension to subscribe!");
        window.open("https://phantom.app/", "_blank");
        return;
      }

      setLoadingTier(tierName);
      const provider = window.phantom?.solana || window.solana;
      await provider.connect();

      const publicKey = provider.publicKey.toString();

      if (solAmount > 0) {
        alert(`Connected Wallet: ${publicKey}\nInitiating transfer of ${solAmount} SOL for ${tierName}...`);
        // Note: In production, build and send the web3.js transaction to your treasury wallet here.
      }

      // Send payload to backend to update Clerk metadata
      const res = await fetch("/api/user/update-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tier: tierName, 
          wallet: publicKey,
          userId: user?.id 
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`Successfully activated ${tierName}! Access unlocked.`);
        window.location.href = "/scanner";
      } else {
        alert("Subscription update failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Payment cancelled or failed.");
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Expiration Notice Banner */}
        {isExpiredNotice && (
          <div className="mb-8 bg-red-500/15 border border-red-500/40 text-red-400 p-4 rounded-xl text-sm text-center font-medium">
            ⚠️ Your previous free trial or subscription has expired. Please choose a package below to restore full access to your Pro Scanner dashboard.
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-emerald-400">DexLive Pricing & Access</h1>
          <p className="text-zinc-400 text-sm mt-2">Unlock institutional-grade Solana momentum scanners and multi-module quant filters.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Tier 1: 7 Days Free Trial */}
          <div className="bg-black border border-zinc-900 hover:border-zinc-800 rounded-2xl p-6 flex flex-col justify-between transition">
            <div>
              <span className="bg-zinc-900 text-zinc-300 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">Starter</span>
              <h3 className="text-xl font-bold mt-4">7 Days Free Trial</h3>
              <p className="text-zinc-400 text-xs mt-2">Complete free access to test core momentum scanners.</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold text-white">0 SOL</span>
                <span className="text-zinc-500 text-xs ml-1">/ 7 days</span>
              </div>
              <ul className="space-y-2.5 text-xs text-zinc-300">
                <li>✓ Basic Mover Scans</li>
                <li>✓ Standard Filters</li>
                <li>✓ Community Access</li>
              </ul>
            </div>
            <button
              onClick={() => handleSolanaPay("Free Trial", 0)}
              disabled={loadingTier === "Free Trial"}
              className="mt-8 w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2.5 rounded-xl transition text-xs uppercase tracking-wider border border-zinc-800"
            >
              {loadingTier === "Free Trial" ? "Processing..." : "Start Free Trial"}
            </button>
          </div>

          {/* Tier 2: 1 Month */}
          <div className="bg-black border border-zinc-900 hover:border-zinc-800 rounded-2xl p-6 flex flex-col justify-between transition">
            <div>
              <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">Monthly</span>
              <h3 className="text-xl font-bold mt-4">1 Month Pass</h3>
              <p className="text-zinc-400 text-xs mt-2">Full access to momentum filters and AI verification.</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold text-emerald-400">0.95 SOL</span>
                <span className="text-zinc-500 text-xs ml-1">/ month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-zinc-300">
                <li>✓ Full Momentum Suite</li>
                <li>✓ Deep Wallet Checks</li>
                <li>✓ AI Technical Reports</li>
              </ul>
            </div>
            <button
              onClick={() => handleSolanaPay("1 Month", 0.95)}
              disabled={loadingTier === "1 Month"}
              className="mt-8 w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-2.5 rounded-xl transition text-xs uppercase tracking-wider"
            >
              {loadingTier === "1 Month" ? "Processing..." : "Pay 0.95 SOL"}
            </button>
          </div>

          {/* Tier 3: 12 Months (Best Value) */}
          <div className="bg-black border border-emerald-500/50 rounded-2xl p-6 flex flex-col justify-between relative shadow-xl shadow-emerald-500/5">
            <div className="absolute -top-3 right-6 bg-emerald-500 text-black text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
              Best Value
            </div>
            <div>
              <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">Annual</span>
              <h3 className="text-xl font-bold mt-4">12 Months Pass</h3>
              <p className="text-zinc-400 text-xs mt-2">Maximum savings for serious traders and quant developers.</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold text-emerald-400">7.95 SOL</span>
                <span className="text-zinc-500 text-xs ml-1">/ year</span>
              </div>
              <ul className="space-y-2.5 text-xs text-zinc-300">
                <li>✓ All Pro Features</li>
                <li>✓ Priority API Queue</li>
                <li>✓ VIP Telegram Group</li>
              </ul>
            </div>
            <button
              onClick={() => handleSolanaPay("12 Months", 7.95)}
              disabled={loadingTier === "12 Months"}
              className="mt-8 w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-2.5 rounded-xl transition text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10"
            >
              {loadingTier === "12 Months" ? "Processing..." : "Pay 7.95 SOL"}
            </button>
          </div>

          {/* Tier 4: 24 Months */}
          <div className="bg-black border border-zinc-900 hover:border-zinc-800 rounded-2xl p-6 flex flex-col justify-between transition">
            <div>
              <span className="bg-purple-500/10 text-purple-400 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">Master Quant</span>
              <h3 className="text-xl font-bold mt-4">24 Months Pass</h3>
              <p className="text-zinc-400 text-xs mt-2">Ultimate 2-year uninterrupted access to all pipelines.</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold text-purple-400">14.95 SOL</span>
                <span className="text-zinc-500 text-xs ml-1">/ 2 years</span>
              </div>
              <ul className="space-y-2.5 text-xs text-zinc-300">
                <li>✓ Unlimited Instant Scans</li>
                <li>✓ Early Access Features</li>
                <li>✓ Custom Quant Rules</li>
              </ul>
            </div>
            <button
              onClick={() => handleSolanaPay("24 Months", 14.95)}
              disabled={loadingTier === "24 Months"}
              className="mt-8 w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl transition text-xs uppercase tracking-wider"
            >
              {loadingTier === "24 Months" ? "Processing..." : "Pay 14.95 SOL"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}