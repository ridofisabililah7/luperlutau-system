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

    // Deteksi apakah pesan ini memicu workflow produksi konten
    const isContentWorkflow =
      lower.includes("review") ||
      lower.includes("ulasan") ||
      lower.includes("artikel") ||
      lower.includes("konten") ||
      lower.includes("carousel") ||
      lower.includes("sepatu") ||
      lower.includes("outfit") ||
      lower.includes("brand");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY_CMO || "");
    const webAI = new GoogleGenerativeAI(
      process.env.GEMINI_KEY_WEB || process.env.GEMINI_KEY_CMO || ""
    );

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    let responseText = "";

    if (isContentWorkflow) {
      // ==========================================
      // PIPELINE RELAY: WEB MEDIA + SOSMED PARALEL
      // ==========================================

      // 1. Eksekusi Divisi Web Media
      const articleModel = webAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        systemInstruction: `Lu adalah Pemimpin Redaksi Divisi Web Media "LuPerluTau".
Tone of voice: Tajam, informatif, conversational, anti-basa-basi korporat.
Tugas: Buat artikel editorial/review mendalam berbasis Markdown dengan format JSON terstruktur lengkap dengan slug, SEO excerpt, pros, cons, dan konten artikel ulasan mendalam.`,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              slug: { type: SchemaType.STRING },
              excerpt: { type: SchemaType.STRING },
              category: { type: SchemaType.STRING },
              content: { type: SchemaType.STRING },
              pros: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              cons: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            },
            required: ["title", "slug", "excerpt", "category", "content", "pros", "cons"],
          },
        },
      });

      // 2. Eksekusi Divisi Sosmed (Carousel Instagram)
      const sosmedModel = genAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        systemInstruction: `Lu adalah Kepala Tim Kreatif Sosmed "LuPerluTau".
Tugas: Buat 5 slide carousel Instagram taktis bernilai tinggi (hook, breakdown poin, tips, cta) lengkap dengan image prompt bahasa Inggris siap pakai untuk AI image generator.`,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              concept_title: { type: SchemaType.STRING },
              slides: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    slide_number: { type: SchemaType.INTEGER },
                    type: { type: SchemaType.STRING },
                    header: { type: SchemaType.STRING },
                    body: { type: SchemaType.STRING },
                    image_prompt: { type: SchemaType.STRING },
                  },
                  required: ["slide_number", "type", "header", "body", "image_prompt"],
                },
              },
            },
            required: ["concept_title", "slides"],
          },
        },
      });

      // Jalankan kedua agen secara paralel agar super cepat
      const [articleResult, sosmedResult] = await Promise.all([
        articleModel.generateContent(
          `Buat artikel ulasan lengkap berdasarkan topik ini: "${userMessage}"`
        ),
        sosmedModel.generateContent(
          `Buat konsep carousel Instagram taktis berdasarkan topik ini: "${userMessage}"`
        ),
      ]);

      const articleData = JSON.parse(articleResult.response.text());
      const sosmedData = JSON.parse(sosmedResult.response.text());

      // Simpan artikel ke database
      await supabase.from("articles").insert({
        title: articleData.title,
        slug: articleData.slug,
        excerpt: articleData.excerpt,
        category: articleData.category,
        content: articleData.content,
        pros: articleData.pros,
        cons: articleData.cons,
        status: "draft",
      });

      // Rangkai teks lengkap untuk Telegram & Simpan ke SocialQueue
      let formattedSlides = `📌 *KONSEP CAROUSEL: ${sosmedData.concept_title}*\n`;
      for (const s of sosmedData.slides) {
        formattedSlides += `\n*SLIDE ${s.slide_number} (${s.type.toUpperCase()})*\n`;
        formattedSlides += `• *Header:* ${s.header}\n`;
        formattedSlides += `• *Body:* ${s.body}\n`;
        formattedSlides += `• *Image Prompt:* \`${s.image_prompt}\`\n`;
      }

      await supabase.from("social_queue").insert({
        platform: "instagram",
        topic: userMessage.slice(0, 100),
        caption: formattedSlides,
        status: "draft",
        slides_content: sosmedData.slides,
      });

      // Catat log relay
      await supabase.from("agent_logs").insert({
        agent_name: "MultiAgent_Relay",
        action: "parallel_web_and_social_dispatch",
        status: "success",
        payload: {
          article_title: articleData.title,
          carousel_title: sosmedData.concept_title,
        },
      });

      // Buat laporan CMO terpadu untuk R di Telegram
      responseText = `Yo R! Sekali perintah langsung beres dua divisi seketika:\n\n📰 *DIVISI WEB MEDIA*\n• *Judul:* ${articleData.title}\n• *Kategori:* #${articleData.category}\n• *Slug:* \`${articleData.slug}\`\n• *Pros:* ${articleData.pros.join(", ")}\n• *Cons:* ${articleData.cons.join(", ")}\n_(Tersimpan di tabel \`articles\`)_\n\n---\n\n📱 *DIVISI SOSMED*\n${formattedSlides}\n_(Tersimpan di tabel \`social_queue\` siap render visual!)_`;
    } else {
      // Mode obrolan biasa / non-konten
      const cmoModel = genAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        systemInstruction: `Lu adalah CMO dari ekosistem agen AI LuPerluTau. 
Panggil lawan bicara "R". Karakter: Tegas, santai, taktis, to-the-point.
Jawab dalam 1 pesan terpadu yang ringkas.`,
      });

      const result = await cmoModel.generateContent(userMessage);
      responseText = result.response.text();

      await supabase.from("agent_logs").insert({
        agent_name: "CMO_Orchestrator",
        action: "handle_telegram_message",
        status: "success",
        payload: { prompt: userMessage, response_snippet: responseText.slice(0, 200) },
      });
    }

    // Kirim balasan ke Telegram
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

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}