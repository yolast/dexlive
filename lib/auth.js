import { currentUser } from "@clerk/nextjs/server";

export async function verifyProAccess() {
  try {
    const user = await currentUser();
    if (!user) return { allowed: false, reason: "Unauthorized" };

    // Normalize and gather all user emails safely
    const emails = user.emailAddresses?.map(e => e.emailAddress?.toLowerCase().trim()) || [];
    const primaryEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase().trim();

    // SUPER ADMIN OVERRIDE (Case-insensitive check across all accounts/aliases)
    const isSuperAdmin = 
      primaryEmail === "rajadsinfo@gmail.com" || 
      emails.includes("rajadsinfo@gmail.com");

    if (isSuperAdmin) {
      return { 
        allowed: true, 
        tier: "SUPER_ADMIN", 
        email: primaryEmail || "rajadsinfo@gmail.com" 
      };
    }

    // Standard Subscription / Trial Check for regular users
    const metadata = user.publicMetadata || {};
    const subscriptionTier = metadata.subscriptionTier; 
    const expiryTimestamp = metadata.subscriptionExpiry || 0;
    const isExpired = Date.now() > expiryTimestamp;

    if (subscriptionTier && !isExpired) {
      return { allowed: true, tier: subscriptionTier, email: primaryEmail };
    }

    return { allowed: false, reason: "Subscription expired or required" };
  } catch (err) {
    console.error("Auth verification error:", err);
    return { allowed: false, reason: "Internal Auth Error" };
  }
}