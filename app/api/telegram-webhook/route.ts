import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY_CMO || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Abaikan jika bukan pesan teks
    if (!body.message || !body.message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = body.message.chat.id;
    const userMessage = body.message.text;

    // Eksekusi proses AI dan kirim balik ke Telegram
    const processMessage = async () => {
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-3.8-flash",
          systemInstruction: `Lu adalah CMO dari sistem agen AI LuPerluTau. 
Panggil lawan bicara "R". Karakter: Tegas, santai, taktis, to-the-point.
ATURAN:
1. Tidak ada janji proses latar belakang atau oper tim fiktif.
2. Jika diminta konten carousel/desain, langsung berikan copywriting padat dan IMAGE PROMPT bahasa Inggris untuk tiap slide.
3. Jawab dalam 1 pesan terpadu yang ringkas.`
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
      } catch (err) {
        console.error("Gagal proses AI / Telegram:", err);
      }
    };

    // Jalankan tanpa menahan return HTTP agar Telegram tidak melakukan retry otomatis
    processMessage();

    // Langsung beri sinyal sukses ke Telegram dalam milidetik pertama
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ ok: true });
  }
}