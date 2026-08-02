"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function HelpPage() {
  const { user } = useUser();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("Technical");
  const [guestEmail, setGuestEmail] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [userTickets, setUserTickets] = useState([]);

  useEffect(() => {
    if (user) {
      fetchUserTickets();
    }
  }, [user]);

  const fetchUserTickets = async () => {
    try {
      const res = await fetch(`/api/support/my-tickets?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setUserTickets(data.tickets || []);
      }
    } catch (err) {
      console.error("Failed to load tickets", err);
    }
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setErrorMsg("Please fill in both subject and message fields.");
      return;
    }

    if (!user && !guestEmail.trim()) {
      setErrorMsg("Please provide your email address so we can reply to you.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const email = user ? user.primaryEmailAddress?.emailAddress : guestEmail;
      const wallet = user?.publicMetadata?.walletAddress || "";

      const res = await fetch("/api/support/create-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user ? user.id : null,
          email,
          wallet,
          subject,
          message,
          category,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Ticket submitted successfully! Our support team will review it.");
        setSubject("");
        setMessage("");
        setGuestEmail("");
        if (user) fetchUserTickets();
      } else {
        setErrorMsg(data.error || "Failed to submit ticket.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-16">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-400 mb-2">Help & Support</h1>
          <p className="text-zinc-400 text-sm">
            Browse FAQs, submit categorized tickets, and track your active support requests in real time.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="bg-black border border-zinc-900 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Frequently Asked Questions</h3>
          <div className="space-y-3 text-sm text-zinc-300">
            <div>
              <strong className="text-emerald-400">Q: How do I run a momentum scan?</strong>
              <p className="text-zinc-400 mt-1">Navigate to Pro Scanner, select your timeframe or momentum strategy, and execute the analysis pipeline.</p>
            </div>
            <div>
              <strong className="text-emerald-400">Q: How does wallet subscription work?</strong>
              <p className="text-zinc-400 mt-1">Visit Pricing, select your package (Free Trial up to 24 Months), and connect your Solana wallet to instantly unlock access.</p>
            </div>
          </div>
        </div>

        {/* User Tickets Tracking Section */}
        {user && userTickets.length > 0 && (
          <div className="bg-black border border-zinc-900 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Your Submitted Tickets</h3>
            <div className="space-y-3">
              {userTickets.map((ticket) => (
                <div key={ticket.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-sm">{ticket.subject}</span>
                    <span className={`px-2.5 py-0.5 rounded-full uppercase font-bold text-[10px] ${ticket.status === 'open' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-zinc-400">{ticket.message}</p>
                  {ticket.admin_reply && (
                    <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg">
                      <strong>Support Reply:</strong> {ticket.admin_reply}
                    </div>
                  )}
                  <div className="text-zinc-500 text-[10px] pt-1">Category: {ticket.category} | Submitted: {new Date(ticket.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Ticket Form */}
        <div className="bg-black border border-zinc-900 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white">Submit a Support Ticket</h3>
            <p className="text-zinc-400 text-xs mt-1">Both registered and unregistered visitors can open a ticket.</p>
          </div>

          {successMsg && (
            <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 p-3 rounded-xl text-xs font-medium">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-500/15 border border-red-500/40 text-red-400 p-3 rounded-xl text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmitTicket} className="space-y-4">
            {!user && (
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Your Email Address (Required for reply)
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-black border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition text-sm"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Inquiry Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-black border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition text-sm"
                >
                  <option value="Technical">Technical & Scanner</option>
                  <option value="Billing">Billing & Solana Pay</option>
                  <option value="General">General Inquiry</option>
                  <option value="Partnership">Partnership</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Transaction verification issue"
                  className="w-full bg-black border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Message Details
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue, question, or feedback in detail..."
                className="w-full bg-black border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition text-sm resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3 rounded-xl transition text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 disabled:opacity-50"
            >
              {submitting ? "Submitting Ticket..." : "Submit Ticket →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}