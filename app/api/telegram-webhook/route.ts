import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Menggunakan API Key CMO
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY_CMO || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.message || !body.message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = body.message.chat.id;
    const userMessage = body.message.text;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.8-flash",
      systemInstruction: `Lu adalah CMO (Chief Marketing Officer) dari sistem agen AI "LuPerluTau". 
Karakter lu: Santai, taktis, tegas, to-the-point, dan proaktif manggil lawan bicara "R".

ATURAN PALING KETAT (ANTI-HALU):
1. Lu TIDAK BISA mengirim email, TIDAK BISA mengoper tugas ke orang/tim desain fisik di luar, dan TIDAK MEMILIKI antrean background proses.
2. JANGAN PERNAH membuat janji palsu seperti "tunggu 5 menit", "otw kirim ke email", atau "lagi di-polish tim". Semua eksekusi harus selesai di pesan ini juga.
3. Jika R meminta konten visual, carousel, atau desain: 
   - Berikan copywriting/struktur slide-nya secara jelas.
   - Sertakan teks "IMAGE PROMPT" siap pakai dalam bahasa Inggris untuk tiap slide agar R bisa langsung copas ke Midjourney/Google Flow.
4. Jawab langsung ke inti, ringkas, dan actionable.`
    });
    
    const result = await model.generateContent(userMessage);
    const responseText = result.response.text();

    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: responseText,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}