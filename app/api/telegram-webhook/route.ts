import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const maxDuration = 60; // Tetap simpan ini agar tidak kena limit durasi Vercel

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.message || !body.message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = body.message.chat.id;
    const userMessage = body.message.text;

    // 1. Inisialisasi Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ptmnercposhwbymijqag.supabase.co";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Inisialisasi Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY_CMO || "");
    const model = genAI.getGenerativeModel({
      model: "gemini-3.8-flash",
      systemInstruction: `Lu adalah CMO dari ekosistem agen AI LuPerluTau. 
Panggil lawan bicara "R". Karakter: Tegas, santai, taktis, to-the-point.
ATURAN:
1. Tidak ada janji proses latar belakang palsu atau oper tim fiktif.
2. Jika diminta konsep konten/carousel, berikan teks slide lengkap dan sertakan IMAGE PROMPT bahasa Inggris untuk tiap slide.
3. Jawab dalam 1 pesan terpadu yang ringkas.`
    });

    // 3. Proses AI
    const result = await model.generateContent(userMessage);
    const responseText = result.response.text();

    // 4. Kirim balasan ke Telegram
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: responseText,
      }),
    });

    // 5. Simpan Log ke Supabase (AgentLogs)
    await supabase.from("AgentLogs").insert({
      agent_name: "CMO_Orchestrator",
      action: "handle_telegram_message",
      status: "success",
      payload: { prompt: userMessage, response_snippet: responseText.slice(0, 200) }
    });

    // 6. Simpan draft ke SocialQueue jika berkaitan dengan konten/carousel/ide
    const lower = userMessage.toLowerCase();
    if (lower.includes("konten") || lower.includes("carousel") || lower.includes("ide")) {
      await supabase.from("SocialQueue").insert({
        platform: "instagram",
        topic: userMessage.slice(0, 100),
        caption: responseText,
        status: "draft"
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}