'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function RequireSubscription({ children }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-pulse text-cyan-400 font-bold">Loading DEXlive Security...</div>
      </div>
    );
  }

  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const isSuperAdmin = email === 'rajadsinfo@gmail.com';
  const hasActiveSub = user?.publicMetadata?.subscriptionStatus === 'active' || isSuperAdmin;

  if (!hasActiveSub) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-extrabold text-red-400 mb-2">ACCESS RESTRICTED</h2>
          <p className="text-slate-400 text-sm mb-6">
            ProScanner features require an active subscription or free trial tier.
          </p>
          <button
            onClick={() => router.push('/subscription')}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg transition"
          >
            Upgrade / Start Free Trial 🚀
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}