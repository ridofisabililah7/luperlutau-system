import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// 1. Inisialisasi Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Inisialisasi Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY_CMO || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.message || !body.message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = body.message.chat.id;
    const userMessage = body.message.text;

    const processMessage = async () => {
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-3.8-flash",
          systemInstruction: `Lu adalah CMO dari ekosistem agen AI LuPerluTau. 
Panggil lawan bicara "R". Karakter: Tegas, santai, taktis, to-the-point.
ATURAN:
1. Tidak ada janji proses latar belakang palsu atau oper tim fiktif.
2. Jika diminta konsep konten/carousel, berikan teks slide lengkap dan sertakan IMAGE PROMPT siap pakai bahasa Inggris untuk tiap slide.
3. Jawab dalam 1 pesan terpadu yang ringkas.`
        });

        const result = await model.generateContent(userMessage);
        const responseText = result.response.text();

        // Kirim balasan ke Telegram
        const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: responseText,
          }),
        });

        // Simpan Log ke Supabase (AgentLogs)
        await supabase.from("AgentLogs").insert({
          agent_name: "CMO_Orchestrator",
          action: "handle_telegram_message",
          status: "success",
          payload: { prompt: userMessage, response_snippet: responseText.slice(0, 200) }
        });

        // Jika pesan berhubungan dengan konten/carousel, simpan draft ke SocialQueue
        if (userMessage.toLowerCase().includes("konten") || userMessage.toLowerCase().includes("carousel")) {
          await supabase.from("SocialQueue").insert({
            platform: "instagram",
            topic: userMessage.slice(0, 100),
            caption: responseText,
            status: "draft"
          });
        }
      } catch (err) {
        console.error("Gagal proses AI / Database:", err);
      }
    };

    // Jalankan eksekusi background agar tidak timeout
    processMessage();

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ ok: true });
  }
}