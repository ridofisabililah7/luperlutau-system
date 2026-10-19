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

    // Deteksi intent pesan
    const isArticleRequest =
      lower.includes("artikel") ||
      lower.includes("review") ||
      lower.includes("ulasan") ||
      lower.includes("tulisan");

    const isCarouselRequest =
      !isArticleRequest &&
      (lower.includes("konten") ||
        lower.includes("carousel") ||
        lower.includes("ide") ||
        lower.includes("post") ||
        lower.includes("sosmed"));

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY_CMO || "");
    const webAI = new GoogleGenerativeAI(
      process.env.GEMINI_KEY_WEB || process.env.GEMINI_KEY_CMO || ""
    );

    let responseText = "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // ==========================================
    // 1. DIVISI WEB MEDIA (T-11: Artikel Ulasan)
    // ==========================================
    if (isArticleRequest) {
      const articleModel = webAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        systemInstruction: `Lu adalah Pemimpin Redaksi Divisi Web Media "LuPerluTau".
Tone of voice: Tajam, informatif, conversational ala anak muda melek teknologi/lifestyle, anti-basa-basi korporat.
Tugas: Buat artikel editorial/review mendalam berbasis Markdown dengan format JSON terstruktur lengkap dengan slug, SEO excerpt, pros, cons, dan konten ulasan.`,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING, description: "Judul artikel SEO-friendly yang memancing klik" },
              slug: { type: SchemaType.STRING, description: "slug url huruf kecil strip (e.g. review-salomon-xt6-streetwear)" },
              excerpt: { type: SchemaType.STRING, description: "Ringkasan ulasan 2-3 kalimat untuk meta description" },
              category: { type: SchemaType.STRING, description: "Kategori artikel (e.g. Fashion, Gadget, Lifestyle, Otomotif)" },
              content: { type: SchemaType.STRING, description: "Isi artikel lengkap format Markdown (heading, spek, analisa pemakaian, kesimpulan)" },
              pros: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "Daftar kelebihan ulasan produk"
              },
              cons: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "Daftar kekurangan ulasan produk"
              },
              telegram_summary: {
                type: SchemaType.STRING,
                description: "Laporan singkat santai untuk R bahwa artikel sudah masuk database portal web"
              }
            },
            required: ["title", "slug", "excerpt", "category", "content", "pros", "cons", "telegram_summary"],
          },
        },
      });

      const result = await articleModel.generateContent(userMessage);
      const parsed = JSON.parse(result.response.text());

      // Insert ke tabel articles (huruf kecil)
      const { error: dbError } = await supabase.from("articles").insert({
        title: parsed.title,
        slug: parsed.slug,
        excerpt: parsed.excerpt,
        category: parsed.category,
        content: parsed.content,
        pros: parsed.pros,
        cons: parsed.cons,
        status: "draft"
      });

      // Format balasan Telegram
      responseText = `${parsed.telegram_summary}\n\n📰 *ARTIKEL SIAP DRAF DI WEB:*\n*Judul:* ${parsed.title}\n*Kategori:* #${parsed.category}\n*Slug:* \`${parsed.slug}\`\n\n📌 *Excerpt:* \n_${parsed.excerpt}_\n\n✅ *Pros:* ${parsed.pros.join(", ")}\n❌ *Cons:* ${parsed.cons.join(", ")}\n\n---\nArtikel ulasan lengkap format Markdown udah tersimpan rapi di tabel *articles* Supabase, R!`;

      // Log ke agent_logs
      await supabase.from("agent_logs").insert({
        agent_name: "WebMedia_Editor",
        action: "handle_article_creation",
        status: dbError ? "error" : "success",
        payload: {
          title: parsed.title,
          slug: parsed.slug,
          db_error: dbError || null
        }
      });

    // ==========================================
    // 2. DIVISI SOSMED (T-12: Carousel Instagram)
    // ==========================================
    } else if (isCarouselRequest) {
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

      // Format teks untuk Telegram
      let formattedSlides = `${parsed.summary_message}\n\n📌 *KONSEP: ${parsed.concept_title}*\n---\n`;
      for (const s of parsed.slides) {
        formattedSlides += `\n*SLIDE ${s.slide_number} (${s.type.toUpperCase()})*\n`;
        formattedSlides += `• *Header:* ${s.header}\n`;
        formattedSlides += `• *Body:* ${s.body}\n`;
        formattedSlides += `• *Image Prompt:* \`${s.image_prompt}\`\n`;
      }
      formattedSlides += `\n---\nDraft otomatis udah masuk ke Supabase social_queue, R.`;

      responseText = formattedSlides;

      // Simpan ke tabel social_queue (huruf kecil)
      await supabase.from("social_queue").insert({
        platform: "instagram",
        topic: userMessage.slice(0, 100),
        caption: responseText,
        status: "draft",
        slides_content: parsed.slides,
      });

      // Log ke agent_logs
      await supabase.from("agent_logs").insert({
        agent_name: "CMO_Orchestrator",
        action: "handle_telegram_message",
        status: "success",
        payload: { prompt: userMessage, response_snippet: responseText.slice(0, 200) },
      });

    // ==========================================
    // 3. DISKUSI UMUM / CHAT BIASA
    // ==========================================
    } else {
      const normalModel = genAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        systemInstruction: `Lu adalah CMO dari ekosistem agen AI LuPerluTau. 
Panggil lawan bicara "R". Karakter: Tegas, santai, taktis, to-the-point.
Jawab to-the-point dalam 1 pesan terpadu yang ringkas.`,
      });

      const result = await normalModel.generateContent(userMessage);
      responseText = result.response.text();

      // Log ke agent_logs
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