export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-16 max-w-4xl mx-auto">
      <h1 className="text-3xl font-extrabold text-emerald-400 mb-6">Privacy Policy</h1>
      <p className="text-zinc-400 text-sm leading-relaxed mb-4">
        Welcome to Dexlive.fun. We respect your privacy and are committed to protecting any data associated with your user account or connected wallet.
      </p>
      <h2 className="text-xl font-bold text-white mt-6 mb-2">1. Information Collection</h2>
      <p className="text-zinc-400 text-sm leading-relaxed mb-4">
        We collect authentication details provided via Clerk and public wallet addresses when interacting with our Solana subscription or scanning tools.
      </p>
      <h2 className="text-xl font-bold text-white mt-6 mb-2">2. Data Usage</h2>
      <p className="text-zinc-400 text-sm leading-relaxed mb-4">
        Data is used strictly to verify subscription status, deliver real-time token telemetry, and run automated AI analytics. We do not sell user data to third parties.
      </p>
    </div>
  );
}