import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { userId, email, wallet, subject, message, category } = await req.json();

    if (!subject || !message) {
      return NextResponse.json({ success: false, error: "Subject and message are required." }, { status: 400 });
    }

    if (!userId && !email) {
      return NextResponse.json({ success: false, error: "Email address is required." }, { status: 400 });
    }

    const ticketEmail = email || "Anonymous";

    // Insert into Supabase
    const { error } = await supabase.from("support_tickets").insert([
      {
        user_id: userId || null,
        email: ticketEmail,
        guest_email: !userId ? ticketEmail : null,
        wallet_address: wallet || "Not Connected",
        subject,
        message,
        category: category || "General",
        status: "open",
      },
    ]);

    if (error) throw new Error(error.message);

// Send Email Notification to Admin Personal Email
    if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
      await resend.emails.send({
        from: "DexLive Support <onboarding@resend.dev>", // Resend test sender
        to: [process.env.ADMIN_EMAIL],                  // Your personal email from .env.local
        subject: `[New Ticket - ${category}] ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #000; color: #fff; padding: 20px; border-radius: 10px;">
            <h2 style="color: #34d399;">New Support Ticket Received</h2>
            <p><strong>From:</strong> ${ticketEmail}</p>
            <p><strong>Wallet:</strong> ${wallet || "None"}</p>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p style="background: #18181b; padding: 12px; border-radius: 6px; margin-top: 10px;"><strong>Message:</strong><br/>${message}</p>
          </div>
        `,
      }).catch(err => console.error("Admin email dispatch failed:", err));
    }
    return NextResponse.json({ success: true, message: "Ticket submitted successfully." });
  } catch (err) {
    console.error("Support Ticket Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}