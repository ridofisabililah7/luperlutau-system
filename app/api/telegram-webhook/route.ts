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
      // 1. Generate Struktur JSON untuk Konten
      const contentModel = genAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        systemInstruction: `Lu adalah CMO dari ekosistem agen AI LuPerluTau. 
Panggil lawan bicara "R". Karakter: Tegas, santai, taktis, to-the-point.
Buat konsep carousel Instagram bernilai tinggi lengkap dengan teks slide dan image prompt bahasa Inggris siap pakai.`,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              summary_message: {
                type: SchemaType.STRING,
                description: "Kalimat pembuka santai dan taktis dari CMO untuk R.",
              },
              concept_title: {
                type: SchemaType.STRING,
                description: "Judul konsep konten.",
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
            required: ["summary_message", "concept_title", "slides"],
          },
        },
      });

      const result = await contentModel.generateContent(userMessage);
      const parsed = JSON.parse(result.response.text());
      slidesData = parsed.slides;

      // Format teks lengkap agar rapi dan enak dibaca langsung di chat Telegram
      let formattedSlides = `${parsed.summary_message}\n\n📌 *KONSEP: ${parsed.concept_title}*\n---\n`;
      for (const s of parsed.slides) {
        formattedSlides += `\n*SLIDE ${s.slide_number} (${s.type.toUpperCase()})*\n`;
        formattedSlides += `• *Header:* ${s.header}\n`;
        formattedSlides += `• *Body:* ${s.body}\n`;
        formattedSlides += `• *Image Prompt:* \`${s.image_prompt}\`\n`;
      }
      formattedSlides += `\n---\nDraft otomatis udah masuk ke Supabase SocialQueue, R.`;

      responseText = formattedSlides;
    } else {
      // 2. Chat Diskusi Umum
      const normalModel = genAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        systemInstruction: `Lu adalah CMO dari ekosistem agen AI LuPerluTau. 
Panggil lawan bicara "R". Karakter: Tegas, santai, taktis, to-the-point.
Jawab to-the-point dalam 1 pesan terpadu yang ringkas.`,
      });

      const result = await normalModel.generateContent(userMessage);
      responseText = result.response.text();
    }

    // 3. Kirim ke Telegram (dengan format Markdown)
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: responseText,
        parse_mode: "Markdown",
      }),
    });

    // 4. Simpan ke Supabase
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

      // Log ke AgentLogs
      await supabase.from("AgentLogs").insert({
        agent_name: "CMO_Orchestrator",
        action: "handle_telegram_message",
        status: "success",
        payload: { prompt: userMessage, response_snippet: responseText.slice(0, 200) },
      });

      // Simpan ke SocialQueue jika ada data slide
      if (isContentRequest && slidesData) {
        await supabase.from("SocialQueue").insert({
          platform: "instagram",
          topic: userMessage.slice(0, 100),
          caption: responseText,
          status: "draft",
          slides_content: slidesData,
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