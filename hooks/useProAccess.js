"use client";
import { useUser } from "@clerk/nextjs";

export function useProAccess() {
  const { user, isLoaded, isSignedIn } = useUser();

  if (!isLoaded || !isSignedIn || !user) {
    return { hasAccess: false, tier: null, loading: !isLoaded };
  }

  // Normalize and check all emails safely
  const emails = user.emailAddresses?.map(e => e.emailAddress?.toLowerCase().trim()) || [];
  const primaryEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase().trim();

  const isSuperAdmin = 
    primaryEmail === "rajadsinfo@gmail.com" || 
    emails.includes("rajadsinfo@gmail.com");

  // Super Admin Bypass
  if (isSuperAdmin) {
    return { hasAccess: true, tier: "SUPER_ADMIN", loading: false };
  }

  const metadata = user.publicMetadata || {};
  const tier = metadata.subscriptionTier;
  const expiry = metadata.subscriptionExpiry || 0;
  const hasAccess = Boolean(tier && expiry > Date.now());

  return { hasAccess, tier, loading: false };
}