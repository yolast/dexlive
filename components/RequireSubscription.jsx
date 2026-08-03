"use client";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RequireSubscription({ children }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400"></div>
        <span className="ml-3 text-xs text-zinc-400">Verifying access...</span>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  // Normalize and check all emails for Super Admin Bypass
  const emails = user.emailAddresses?.map(e => e.emailAddress?.toLowerCase().trim()) || [];
  const primaryEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase().trim();
  
  const isSuperAdmin = 
    primaryEmail === "rajadsinfo@gmail.com" || 
    emails.includes("rajadsinfo@gmail.com");

  if (isSuperAdmin) {
    return children;
  }

  // Standard Subscription Check for regular users
  const metadata = user.publicMetadata || {};
  const tier = metadata.subscriptionTier;
  const expiry = metadata.subscriptionExpiry || 0;
  const hasValidSub = Boolean(tier && expiry > Date.now());

  if (!hasValidSub) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md shadow-2xl">
          <div className="text-red-500 font-bold text-lg mb-2">ACCESS RESTRICTED</div>
          <p className="text-zinc-400 text-xs mb-6">
            This feature requires an active DEXLive subscription or free trial. Upgrade your wallet to unlock institutional-grade scanning.
          </p>
          <a
            href="/subscription"
            className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-6 rounded-xl transition text-xs shadow-lg shadow-emerald-500/10"
          >
            Choose Subscription Plan →
          </a>
        </div>
      </div>
    );
  }

  return children;
}