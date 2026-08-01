import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  try {
    const { tokenAddress } = await req.json();

    // 1. Fetch data from Parse.bot (GMGN API)
    let tokenData = {};
    try {
      const response = await fetch(`https://api.parse.bot/v1/token/${tokenAddress}`, {
        headers: { Authorization: `Bearer ${process.env.PARSE_BOT_API_KEY}` },
      });
      tokenData = await response.json();
    } catch (e) {
      tokenData = { address: tokenAddress, note: "Parse.bot raw data placeholder" };
    }

    // 2. Build your custom analysis prompt
    const prompt = `
      You are an Elite Solana Meme Coin Discovery Scanner.
      Analyze this token (${tokenAddress}) and provide a concise risk and metrics assessment based on the provided data:
      
      ${JSON.stringify(tokenData)}
      
      Format response in clean Markdown with:
      - PASS / WATCH / REJECT status
      - Market Cap, Transactions, and Traders summary
      - Key Risk Highlights (Clone risk, concentration)
    `;

    // 3. Request analysis using Gemini 2.5 Flash
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return NextResponse.json({ analysis: response.text });
  } catch (error) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: "Failed to run analysis" }, { status: 500 });
  }
}
