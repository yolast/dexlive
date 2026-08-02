import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    const { tier, wallet, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized user ID" }, { status: 401 });
    }

    // Determine days to add based on selected tier
    let daysToAdd = 7;
    if (tier === "1 Month") daysToAdd = 30;
    else if (tier === "12 Months") daysToAdd = 365;
    else if (tier === "24 Months") daysToAdd = 730;

    const expiryDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

    // Update Clerk public metadata
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        subscriptionTier: tier,
        walletAddress: wallet,
        subscriptionExpiry: expiryDate,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated user ${userId} to ${tier}`,
      expiryDate,
    });
  } catch (error) {
    console.error("Subscription Backend Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}