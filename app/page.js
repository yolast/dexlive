import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <div className="absolute top-6 right-6">
        {userId && <UserButton afterSignOutUrl="/" />}
      </div>

      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-4xl font-extrabold text-emerald-400 tracking-tight">DexLive</h1>
        <p className="text-zinc-400 text-sm">
          Welcome to DexLive — AI-Powered Solana Meme Coin Analyzer. Protect your capital with multi-stage automated filtering.
        </p>

        <div className="pt-4 flex justify-center gap-4">
          <Link
            href="/scanner"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-6 rounded-lg text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition"
          >
            {userId ? "Open Scanner →" : "Sign In to Access →"}
          </Link>
        </div>
      </div>
    </main>
  );
}