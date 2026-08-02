"use client";
import { useUser } from "@clerk/nextjs";

export function useProAccess() {
  const { user, isLoaded, isSignedIn } = useUser();

  if (!isLoaded || !isSignedIn || !user) {
    return { hasAccess: false, tier: null, loading: !isLoaded };
  }

  const primaryEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress;

  // Super Admin Bypass
  if (primaryEmail === "rajadsinfo@gmail.com") {
    return { hasAccess: true, tier: "SUPER_ADMIN", loading: false };
  }

  const metadata = user.publicMetadata || {};
  const tier = metadata.subscriptionTier;
  const expiry = metadata.subscriptionExpiry || 0;
  const hasAccess = Boolean(tier && expiry > Date.now());

  return { hasAccess, tier, loading: false };
}