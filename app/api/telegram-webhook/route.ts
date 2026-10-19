import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const maxDuration = 60;

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
    const lower = userMessage.toLowerCase();
    const isContentRequest =
      lower.includes("konten") ||
      lower.includes("carousel") ||
      lower.includes("ide") ||
      lower.includes("post");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY_CMO || "");

    let responseText = "";
    let slidesData: any = null;

    if (isContentRequest) {
      // 1. Mode Konten: Minta output JSON terstruktur agar slides_content langsung rapi
      const contentModel = genAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        systemInstruction: `Lu adalah CMO dari ekosistem agen AI LuPerluTau. 
Panggil lawan bicara "R". Karakter: Tegas, santai, taktis, to-the-point.
Buat konsep carousel Instagram lengkap dengan teks slide dan image prompt bahasa Inggris.`,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              summary_message: {
                type: SchemaType.STRING,
                description:
                  "Pesan balasan ramah/taktis untuk Telegram yang memuat ringkasan konten dan teks slide.",
              },
              slides: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    slide_number: { type: SchemaType.INTEGER },
                    type: { type: SchemaType.STRING, description: "hook, body, atau cta" },
                    header: { type: SchemaType.STRING },
                    body: { type: SchemaType.STRING },
                    image_prompt: { type: SchemaType.STRING },
                  },
                  required: ["slide_number", "type", "header", "body", "image_prompt"],
                },
              },
            },
            required: ["summary_message", "slides"],
          },
        },
      });

      const result = await contentModel.generateContent(userMessage);
      const parsed = JSON.parse(result.response.text());
      responseText = parsed.summary_message;
      slidesData = parsed.slides;
    } else {
      // 2. Mode Diskusi Biasa: Jawaban teks polos
      const normalModel = genAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        systemInstruction: `Lu adalah CMO dari ekosistem agen AI LuPerluTau. 
Panggil lawan bicara "R". Karakter: Tegas, santai, taktis, to-the-point.
Jawab to-the-point dalam 1 pesan ringkas.`,
      });

      const result = await normalModel.generateContent(userMessage);
      responseText = result.response.text();
    }

    // 3. Kirim balasan ke Telegram
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: responseText,
      }),
    });

    // 4. Simpan ke Supabase
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

      // Log aktivitas
      await supabase.from("AgentLogs").insert({
        agent_name: "CMO_Orchestrator",
        action: "handle_telegram_message",
        status: "success",
        payload: { prompt: userMessage, response_snippet: responseText.slice(0, 200) },
      });

      // Simpan ke SocialQueue jika permintaan konten
      if (isContentRequest) {
        await supabase.from("SocialQueue").insert({
          platform: "instagram",
          topic: userMessage.slice(0, 100),
          caption: responseText,
          status: "draft",
          slides_content: slidesData, // Terisi JSON terstruktur otomatis
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