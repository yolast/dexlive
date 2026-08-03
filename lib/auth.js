import { currentUser } from "@clerk/nextjs/server";

export async function verifyProAccess() {
  try {
    const user = await currentUser();
    if (!user) return { allowed: false, reason: "Unauthorized" };

    // Extract primary email safely from Clerk user object
    const primaryEmailId = user.primaryEmailAddressId;
    const emailObj = user.emailAddresses?.find(e => e.id === primaryEmailId);
    const userEmail = emailObj ? emailObj.emailAddress : user.emailAddresses?.[0]?.emailAddress;

    // 1. SUPER ADMIN OVERRIDE FOR RAJADSINFO@GMAIL.COM
    if (userEmail === "rajadsinfo@gmail.com") {
      return { 
        allowed: true, 
        tier: "SUPER_ADMIN", 
        email: userEmail 
      };
    }

    // 2. Standard Subscription / Trial Check for regular users
    const metadata = user.publicMetadata || {};
    const subscriptionTier = metadata.subscriptionTier; 
    const expiryTimestamp = metadata.subscriptionExpiry || 0;
    const isExpired = Date.now() > expiryTimestamp;

    if (subscriptionTier && !isExpired) {
      return { allowed: true, tier: subscriptionTier, email: userEmail };
    }

    return { allowed: false, reason: "Subscription expired or required" };
  } catch (err) {
    console.error("Auth verification error:", err);
    return { allowed: false, reason: "Internal Auth Error" };
  }
}