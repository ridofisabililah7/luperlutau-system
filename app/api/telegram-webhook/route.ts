import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const maxDuration = 60;

// Supabase Credentials
const SUPABASE_URL = "https://ptmnercposhwbymijqag.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0bW5lcmNwb3Nod2J5bWlqcWFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNDYzMDgsImV4cCI6MjEwNzcyMjMwOH0.EgBxTqczQRkfrf9QMwCbGVmy60A0Ai8eJo1SOOWVNj8";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.message || !body.message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = body.message.chat.id;
    const userMessage = body.message.text;

    // 1. Inisialisasi Gemini AI dengan model gemini-3.5-flash
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY_CMO || "");
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction: `Lu adalah CMO dari ekosistem agen AI LuPerluTau. 
Panggil lawan bicara "R". Karakter: Tegas, santai, taktis, to-the-point.
ATURAN:
1. Tidak ada janji proses latar belakang palsu atau oper tim fiktif.
2. Jika diminta konsep konten/carousel, berikan teks slide lengkap dan sertakan IMAGE PROMPT bahasa Inggris untuk tiap slide.
3. Jawab dalam 1 pesan terpadu yang ringkas.`,
    });

    // 2. Generate balasan AI
    const result = await model.generateContent(userMessage);
    const responseText = result.response.text();

    // 3. Kirim ke Telegram lebih dulu
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: responseText,
      }),
    });

    // 4. Simpan ke Supabase (AgentLogs & SocialQueue)
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

      await supabase.from("AgentLogs").insert({
        agent_name: "CMO_Orchestrator",
        action: "handle_telegram_message",
        status: "success",
        payload: { prompt: userMessage, response_snippet: responseText.slice(0, 200) },
      });

      const lower = userMessage.toLowerCase();
      if (lower.includes("konten") || lower.includes("carousel") || lower.includes("ide")) {
        await supabase.from("SocialQueue").insert({
          platform: "instagram",
          topic: userMessage.slice(0, 100),
          caption: responseText,
          status: "draft",
        });
      }
    } catch (dbErr) {
      console.error("Supabase insert error:", dbErr);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}