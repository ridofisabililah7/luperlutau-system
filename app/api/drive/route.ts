import { NextRequest, NextResponse } from "next/server";
import { uploadMarkdownToDrive, listKnowledgeFiles, getFileContent } from "../../lib/drive";

// Model embedding lokal Ollama
async function getEmbedding(text: string) {
  try {
    const res = await fetch("http://localhost:11434/api/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "nomic-embed-text",
        prompt: text,
      }),
    });
    const data = await res.json();
    return data.embedding;
  } catch (err) {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Mode 1: Upload artikel yang diapprove CEO R ke Google Drive
  if (body.action === "upload_approved") {
    const { topic, sections } = body;
    let markdown = `# Laporan Eksekutif: ${topic}\n`;
    markdown += `Tanggal: ${new Date().toLocaleString("id-ID")}\n\n---\n\n`;

    sections.forEach((sec: any) => {
      markdown += `## ${sec.name} - ${sec.role}\n\n${sec.text}\n\n---\n\n`;
    });

    const file = await uploadMarkdownToDrive(topic, markdown);
    if (!file) {
      return NextResponse.json({ error: "Gagal menyimpan ke Google Drive" }, { status: 500 });
    }

    return NextResponse.json({ success: true, file });
  }

  // Mode 2: Baca pengetahuan (RAG Knowledge Ingestion) dari Google Drive
  if (body.action === "sync_knowledge") {
    const files = await listKnowledgeFiles();
    return NextResponse.json({ filesCount: files.length, files });
  }

  return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
}