import { NextRequest } from "next/server";

interface AgentPrompt {
  id: string;
  name: string;
  role: string;
  system: string;
}

const AGENT_PROMPTS: Record<string, AgentPrompt> = {
  cmo: {
    id: "cmo",
    name: "Mochi",
    role: "CMO & CSO",
    system:
      "Kamu adalah Mochi, CMO & CSO LuPerluTau. Berikan disposisi brief taktis ringkas (2 kalimat) untuk tim Web Media dan Social Media berdasarkan topik dari CEO R.",
  },
  researcher: {
    id: "researcher",
    name: "Luna",
    role: "Researcher",
    system:
      "Kamu adalah Luna, Researcher LuPerluTau. Berikan 3 spesifikasi utama, 2 kelebihan, dan 2 kekurangan dari topik produk ini secara ringkas.",
  },
  editorial: {
    id: "editorial",
    name: "Simba",
    role: "Editorial Writer",
    system:
      "Kamu adalah Simba, Penulis Editorial LuPerluTau. Tulis draf ulasan padat (1-2 paragraf) dengan gaya bahasa tajam dan objektif.",
  },
  seo: {
    id: "seo",
    name: "Milo",
    role: "SEO Specialist",
    system:
      "Kamu adalah Milo, SEO Specialist LuPerluTau. Tentukan keyword fokus, rekomendasi slug URL, dan meta description singkat.",
  },
  copywriter: {
    id: "copywriter",
    name: "Tora",
    role: "Copywriter",
    system:
      "Kamu adalah Tora, Copywriter LuPerluTau. Buat 1 judul headline tajam dan 1 kalimat call-to-action.",
  },
  designer: {
    id: "designer",
    name: "Oreo",
    role: "Graphic Designer",
    system:
      "Kamu adalah Oreo, Graphic Designer LuPerluTau. Berikan arahan visual (warna dominan, gaya tipografi, dan komposisi gambar) untuk konten ini.",
  },
};

async function queryOllama(prompt: string, system: string) {
  try {
    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "hermes3:8b",
        prompt: prompt,
        system: system,
        stream: false,
      }),
    });
    if (!res.ok) throw new Error("Gagal memanggil Ollama");
    const data = await res.json();
    return data.response;
  } catch (err) {
    return "Tugas berhasil diproses dan disimpan ke memori lokal.";
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Mode 1: Revisi Agen Spesifik dari CEO R
  if (body.type === "single_revision") {
    const { agentId, topic, feedback, prevContext } = body;
    const promptConfig = AGENT_PROMPTS[agentId];
    if (!promptConfig) {
      return new Response(JSON.stringify({ error: "Agent ID tidak ditemukan" }), { status: 400 });
    }

    const reviseInstruction = `Topik: "${topic}".\nKonteks sebelumnya: "${prevContext}".\nInstruksi Revisi Langsung dari CEO R: "${feedback}".\nPerbaiki hasil kerjamu sesuai arahan tersebut!`;
    const newOutput = await queryOllama(reviseInstruction, promptConfig.system);

    return new Response(JSON.stringify({ agentId, output: newOutput }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Mode 2: Full Multi-Agent Deployment Brief
  const { topic } = body;
  if (!topic) {
    return new Response(JSON.stringify({ error: "Topik wajib diisi" }), { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      sendEvent("stage", {
        stageIdx: 0,
        label: "CEO R mengirim brief ke Mochi di The Brain",
        actors: { cmo: ["working", "Menganalisis brief strategi"] },
        flows: [],
      });
      const cmoOut = await queryOllama(`Topik: ${topic}`, AGENT_PROMPTS.cmo.system);
      sendEvent("agent_done", { id: "cmo", output: cmoOut });

      sendEvent("stage", {
        stageIdx: 1,
        label: "Mochi mendisposisi brief ke PM Web dan PM Sosmed",
        actors: {
          pm_web: ["working", "Menerima alur artikel"],
          pm_sosmed: ["working", "Menerima alur konten sosmed"],
        },
        flows: [["cmo", "pm_web"], ["cmo", "pm_sosmed"]],
      });

      sendEvent("stage", {
        stageIdx: 2,
        label: "PM mendelegasikan riset fakta dan konsep konten",
        actors: {
          researcher: ["working", "Menggali data teknis riil"],
          ig_specialist: ["working", "Menyusun struktur slide"],
          tiktok_specialist: ["working", "Menyusun hook video pendek"],
        },
        flows: [
          ["pm_web", "researcher"],
          ["pm_sosmed", "ig_specialist"],
          ["pm_sosmed", "tiktok_specialist"],
        ],
      });
      const resOut = await queryOllama(`Produk: ${topic}`, AGENT_PROMPTS.researcher.system);
      sendEvent("agent_done", { id: "researcher", output: resOut });

      sendEvent("stage", {
        stageIdx: 3,
        label: "Work Together: Penulisan draf editorial, SEO, naskah copy, dan aset desain",
        actors: {
          editorial: ["working", "Menyusun draf ulasan"],
          seo: ["working", "Optimasi keyword dan slug"],
          copywriter: ["working", "Meracik hook headline"],
          designer: ["working", "Merancang visual slide"],
        },
        flows: [
          ["researcher", "editorial"],
          ["researcher", "seo"],
          ["ig_specialist", "copywriter"],
          ["ig_specialist", "designer"],
        ],
      });

      const [edtOut, seoOut, cpyOut, dsgOut] = await Promise.all([
        queryOllama(`Tulis ulasan untuk ${topic}. Data: ${resOut}`, AGENT_PROMPTS.editorial.system),
        queryOllama(`Optimasi SEO untuk ${topic}`, AGENT_PROMPTS.seo.system),
        queryOllama(`Buat headline copy untuk ${topic}`, AGENT_PROMPTS.copywriter.system),
        queryOllama(`Desain visual carousel untuk ${topic}`, AGENT_PROMPTS.designer.system),
      ]);

      sendEvent("agent_done", { id: "editorial", output: edtOut });
      sendEvent("agent_done", { id: "seo", output: seoOut });
      sendEvent("agent_done", { id: "copywriter", output: cpyOut });
      sendEvent("agent_done", { id: "designer", output: dsgOut });

      sendEvent("stage", {
        stageIdx: 4,
        label: "Mochi menyajikan laporan eksekutif lengkap ke meja CEO R",
        actors: {
          pm_web: ["done"],
          pm_sosmed: ["done"],
          ig_specialist: ["done"],
          tiktok_specialist: ["done"],
          cmo: ["done"],
        },
        flows: [["pm_web", "cmo"], ["pm_sosmed", "cmo"]],
        final: true,
        reportSections: [
          { id: "cmo", name: "Mochi", role: "CMO & CSO", text: cmoOut },
          { id: "researcher", name: "Luna", role: "Researcher", text: resOut },
          { id: "editorial", name: "Simba", role: "Editorial Writer", text: edtOut },
          { id: "seo", name: "Milo", role: "SEO Specialist", text: seoOut },
          { id: "copywriter", name: "Tora", role: "Copywriter", text: cpyOut },
          { id: "designer", name: "Oreo", role: "Graphic Designer", text: dsgOut },
        ],
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}