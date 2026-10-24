"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from "react";

type Status = "idle" | "working" | "done";
type Tab = "office" | "tasks" | "reports" | "brain" | "approvals";
type Acc =
  | "tux"
  | "glasses"
  | "tie"
  | "hood"
  | "watch"
  | "denim"
  | "headset"
  | "beanie"
  | "beret";

interface Agent {
  id: string;
  name: string;
  role: string;
  activity: string;
}

interface Pod {
  id: string;
  code: string;
  title: string;
  division: "Web Media" | "Social Media";
  pos: [number, number];
  floor: string;
  rug: string;
  wall: string;
  wall2: string;
  edge: string;
  glow: string;
  members: Agent[];
}

interface Cast {
  fur: string;
  furDark: string;
  furSide: string;
  outfit: string;
  outfitSide: string;
  accent: string;
  acc: Acc;
}

interface ReportSection {
  id: string;
  name: string;
  role: string;
  text: string;
}

interface Report {
  id: number;
  topic: string;
  time: string;
  status: "pending" | "approved" | "rejected";
  sections: ReportSection[];
}

const CMO: Agent = {
  id: "cmo",
  name: "Mochi",
  role: "CMO & CSO (Meta-Orchestrator)",
  activity: "Menunggu brief strategis dari CEO R",
};

const PODS: Pod[] = [
  {
    id: "pod-research",
    code: "RES",
    title: "Research",
    division: "Web Media",
    pos: [0, -320],
    floor: "#0f2942",
    rug: "#1a4369",
    wall: "#1e4e79",
    wall2: "#163a5c",
    edge: "#38bdf8",
    glow: "rgba(56,189,248,0.45)",
    members: [
      {
        id: "researcher",
        name: "Luna",
        role: "Researcher",
        activity: "Deep-dive spesifikasi teknis dan ulasan pengguna riil",
      },
    ],
  },
  {
    id: "pod-editorial",
    code: "EDT",
    title: "Editorial",
    division: "Web Media",
    pos: [-305, -160],
    floor: "#3b2313",
    rug: "#633b1f",
    wall: "#854d27",
    wall2: "#693c1e",
    edge: "#fb923c",
    glow: "rgba(251,146,60,0.45)",
    members: [
      {
        id: "pm_web",
        name: "Kuro",
        role: "PM Web Media",
        activity: "Mengatur pipeline editorial dan kontrol kualitas artikel",
      },
      {
        id: "editorial",
        name: "Simba",
        role: "Editorial Writer",
        activity: "Menyusun draf artikel Markdown beserta analisis pros dan cons",
      },
    ],
  },
  {
    id: "pod-seo",
    code: "SEO",
    title: "SEO & Web",
    division: "Web Media",
    pos: [-305, 170],
    floor: "#0f3322",
    rug: "#195438",
    wall: "#206b47",
    wall2: "#185236",
    edge: "#4ade80",
    glow: "rgba(74,222,128,0.45)",
    members: [
      {
        id: "seo",
        name: "Milo",
        role: "SEO Specialist",
        activity: "Optimasi kata kunci, meta description, dan struktur heading",
      },
    ],
  },
  {
    id: "pod-social",
    code: "SOC",
    title: "Social Ops",
    division: "Social Media",
    pos: [305, -160],
    floor: "#3d290d",
    rug: "#664516",
    wall: "#8a5d1d",
    wall2: "#6b4716",
    edge: "#facc15",
    glow: "rgba(250,204,21,0.45)",
    members: [
      {
        id: "pm_sosmed",
        name: "Boba",
        role: "PM Sosmed",
        activity: "Mengelola jadwal distribusi konten dan SLA sosial media",
      },
      {
        id: "ig_specialist",
        name: "Nori",
        role: "IG Specialist",
        activity: "Merancang struktur slide carousel berbasis retensi",
      },
    ],
  },
  {
    id: "pod-scripts",
    code: "VID",
    title: "Short Video",
    division: "Social Media",
    pos: [0, 320],
    floor: "#3d1420",
    rug: "#662035",
    wall: "#872a46",
    wall2: "#692036",
    edge: "#fb7185",
    glow: "rgba(251,113,133,0.45)",
    members: [
      {
        id: "tiktok_specialist",
        name: "Chai",
        role: "TikTok Specialist",
        activity: "Merancang storyboard video pendek dan hook 3 detik pertama",
      },
    ],
  },
  {
    id: "pod-creative",
    code: "CRV",
    title: "Creative Studio",
    division: "Social Media",
    pos: [305, 170],
    floor: "#291847",
    rug: "#432775",
    wall: "#59349c",
    wall2: "#452878",
    edge: "#c084fc",
    glow: "rgba(192,132,252,0.45)",
    members: [
      {
        id: "copywriter",
        name: "Tora",
        role: "Copywriter",
        activity: "Meracik headline, naskah slide, dan microcopy konversi",
      },
      {
        id: "designer",
        name: "Oreo",
        role: "Graphic Designer",
        activity: "Mengeksekusi prompt visual dan merakit slide carousel siap pakai",
      },
    ],
  },
];

const CAST: Record<string, Cast> = {
  cmo: { fur: "#f8fafc", furSide: "#e2e8f0", furDark: "#cbd5e1", outfit: "#18181b", outfitSide: "#09090b", accent: "#ef4444", acc: "tux" },
  researcher: { fur: "#e2e8f0", furSide: "#cbd5e1", furDark: "#94a3b8", outfit: "#f8fafc", outfitSide: "#cbd5e1", accent: "#0284c7", acc: "glasses" },
  pm_web: { fur: "#52525b", furSide: "#3f3f46", furDark: "#27272a", outfit: "#334155", outfitSide: "#1e293b", accent: "#ef4444", acc: "tie" },
  editorial: { fur: "#fbbf24", furSide: "#f59e0b", furDark: "#d97706", outfit: "#475569", outfitSide: "#334155", accent: "#38bdf8", acc: "hood" },
  seo: { fur: "#fde68a", furSide: "#fcd34d", furDark: "#f59e0b", outfit: "#e2e8f0", outfitSide: "#cbd5e1", accent: "#10b981", acc: "tie" },
  pm_sosmed: { fur: "#d6a87c", furSide: "#c08c5c", furDark: "#a37043", outfit: "#7c3aed", outfitSide: "#5b21b6", accent: "#fbbf24", acc: "watch" },
  ig_specialist: { fur: "#ffffff", furSide: "#e4e4e7", furDark: "#d4d4d8", outfit: "#2563eb", outfitSide: "#1d4ed8", accent: "#93c5fd", acc: "denim" },
  tiktok_specialist: { fur: "#c28155", furSide: "#a6683e", furDark: "#8a522d", outfit: "#1f2937", outfitSide: "#111827", accent: "#22d3ee", acc: "headset" },
  copywriter: { fur: "#fb923c", furSide: "#f97316", furDark: "#ea580c", outfit: "#e11d48", outfitSide: "#be123c", accent: "#fde047", acc: "beanie" },
  designer: { fur: "#71717a", furSide: "#52525b", furDark: "#3f3f46", outfit: "#db2777", outfitSide: "#9d174d", accent: "#a855f7", acc: "beret" },
};

const S = 196;
const WALL_H = 72;
const slotsFor = (n: number) => (n === 1 ? [98] : [58, 138]);

const AGENTS: Record<string, Agent> = { cmo: CMO };
const POS: Record<string, [number, number]> = { cmo: [0, 0] };
const POD_OF: Record<string, Pod> = {};

PODS.forEach((pod) => {
  const [cx, cy] = pod.pos;
  pod.members.forEach((m, i) => {
    AGENTS[m.id] = m;
    POD_OF[m.id] = pod;
    POS[m.id] = [cx - S / 2 + slotsFor(pod.members.length)[i], cy - S / 2 + 86];
  });
});

const P3D: CSSProperties = { transformStyle: "preserve-3d" };
const BB = "rotateZ(45deg) rotateX(-60deg)";

function Billboard({
  x,
  y,
  z = 0,
  w = 96,
  h = 60,
  children,
  onClick,
}: {
  x: number;
  y: number;
  z?: number;
  w?: number;
  h?: number;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 0,
        height: 0,
        ...P3D,
        transform: `translateZ(${z}px)`,
      }}
    >
      <div
        onClick={(e) => {
          if (onClick) {
            e.stopPropagation();
            onClick();
          }
        }}
        style={{
          position: "absolute",
          left: -w / 2,
          top: -h,
          width: w,
          height: h,
          transformOrigin: "50% 100%",
          transform: BB,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          cursor: onClick ? "pointer" : "default",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Box({
  x,
  y,
  z = 0,
  w,
  d,
  h,
  top,
  left,
  right,
  front,
  back,
}: {
  x: number;
  y: number;
  z?: number;
  w: number;
  d: number;
  h: number;
  top: string;
  left: string;
  right: string;
  front?: string;
  back?: string;
}) {
  const face: CSSProperties = {
    position: "absolute",
    transformOrigin: "0 0",
    backfaceVisibility: "hidden",
  };
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 0,
        height: 0,
        ...P3D,
        transform: `translateZ(${z}px)`,
      }}
    >
      <div style={{ ...face, left: 0, top: 0, width: w, height: d, background: top, transform: `translateZ(${h}px)` }} />
      <div style={{ ...face, left: 0, top: d, width: w, height: h, background: front ?? right, transform: "rotateX(90deg)" }} />
      <div style={{ ...face, left: 0, top: 0, width: w, height: h, background: back ?? left, transform: "rotateX(90deg)" }} />
      <div style={{ ...face, left: 0, top: 0, width: h, height: d, background: left, transform: "rotateY(-90deg)" }} />
      <div style={{ ...face, left: w, top: 0, width: h, height: d, background: right, transform: "rotateY(-90deg)" }} />
    </div>
  );
}

function Cat3D({
  x,
  y,
  z = 0,
  cast,
  status,
  onClick,
}: {
  x: number;
  y: number;
  z?: number;
  cast: Cast;
  status: Status;
  onClick?: () => void;
}) {
  const { fur, furSide, furDark, outfit, outfitSide, accent, acc } = cast;
  const isWorking = status === "working";

  return (
    <div
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 0,
        height: 0,
        ...P3D,
        transform: `translateZ(${z}px)`,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <Box x={-7} y={4} z={8} w={5} d={6} h={8} top={fur} left={furDark} right={furSide} />
      <Box x={2} y={4} z={8} w={5} d={6} h={8} top={fur} left={furDark} right={furSide} />

      <div className="soft wag3d" style={{ position: "absolute", ...P3D }}>
        <Box x={-2} y={-14} z={14} w={4} d={8} h={4} top={fur} left={furDark} right={furSide} />
        <Box x={-2} y={-16} z={18} w={4} d={4} h={10} top={fur} left={furDark} right={furSide} />
      </div>

      <div className={isWorking ? "soft bob3d" : ""} style={{ position: "absolute", ...P3D }}>
        <Box x={-9} y={-7} z={14} w={18} d={14} h={16} top={outfit} left={outfitSide} right={outfit} />

        {acc === "tux" && (
          <>
            <Box x={-3} y={6} z={18} w={6} d={2} h={11} top="#ffffff" left="#e2e8f0" right="#ffffff" />
            <Box x={-3} y={7} z={26} w={6} d={2} h={3} top={accent} left={accent} right={accent} />
          </>
        )}
        {acc === "tie" && (
          <>
            <Box x={-3} y={6} z={26} w={6} d={2} h={4} top="#ffffff" left="#cbd5e1" right="#ffffff" />
            <Box x={-1.5} y={7} z={18} w={3} d={2} h={9} top={accent} left={accent} right={accent} />
          </>
        )}
        {acc === "hood" && (
          <Box x={-10} y={-8} z={27} w={20} d={15} h={4} top={outfit} left={outfitSide} right={outfitSide} />
        )}
        {acc === "denim" && (
          <Box x={-1} y={6.5} z={15} w={2} d={2} h={14} top={accent} left={accent} right={accent} />
        )}

        <div className={isWorking ? "soft pawL" : ""} style={{ position: "absolute", ...P3D }}>
          <Box x={-12} y={0} z={20} w={5} d={16} h={5} top={outfit} left={outfitSide} right={outfit} />
          <Box x={-12} y={14} z={19} w={5} d={5} h={5} top={fur} left={furDark} right={furSide} />
          {acc === "watch" && (
            <Box x={-12.5} y={10} z={20.5} w={6} d={3} h={5.5} top={accent} left={accent} right={accent} />
          )}
        </div>
        <div className={isWorking ? "soft pawR" : ""} style={{ position: "absolute", ...P3D }}>
          <Box x={7} y={0} z={20} w={5} d={16} h={5} top={outfit} left={outfitSide} right={outfit} />
          <Box x={7} y={14} z={19} w={5} d={5} h={5} top={fur} left={furDark} right={furSide} />
        </div>

        <Box x={-11} y={-8} z={30} w={22} d={18} h={16} top={fur} left={furDark} right={furSide} front={fur} />
        <Box x={-10} y={-5} z={46} w={6} d={5} h={4} top={fur} left={furDark} right={furSide} />
        <Box x={-9} y={-4} z={50} w={4} d={4} h={3} top={fur} left={furDark} right={furSide} />
        <Box x={-8.5} y={0.2} z={46.5} w={3.5} d={1} h={3.5} top="#f472b6" left="#f472b6" right="#f472b6" />

        <Box x={4} y={-5} z={46} w={6} d={5} h={4} top={fur} left={furDark} right={furSide} />
        <Box x={5} y={-4} z={50} w={4} d={4} h={3} top={fur} left={furDark} right={furSide} />
        <Box x={5} y={0.2} z={46.5} w={3.5} d={1} h={3.5} top="#f472b6" left="#f472b6" right="#f472b6" />

        <Box x={-7} y={9.5} z={36} w={3} d={1.5} h={4} top="#09090b" left="#09090b" right="#09090b" />
        <Box x={-6.5} y={10.2} z={38.5} w={1.2} d={1.5} h={1.2} top="#ffffff" left="#ffffff" right="#ffffff" />
        <Box x={4} y={9.5} z={36} w={3} d={1.5} h={4} top="#09090b" left="#09090b" right="#09090b" />
        <Box x={4.5} y={10.2} z={38.5} w={1.2} d={1.5} h={1.2} top="#ffffff" left="#ffffff" right="#ffffff" />

        <Box x={-4} y={9.5} z={32} w={8} d={2} h={3.5} top="#ffffff" left="#e2e8f0" right="#ffffff" />
        <Box x={-1.5} y={10.5} z={34} w={3} d={2} h={2} top="#f472b6" left="#ec4899" right="#f472b6" />

        <Box x={-9.5} y={9.4} z={33.5} w={3} d={1.2} h={2} top="#fda4af" left="#fda4af" right="#fda4af" />
        <Box x={6.5} y={9.4} z={33.5} w={3} d={1.2} h={2} top="#fda4af" left="#fda4af" right="#fda4af" />
        <Box x={-12} y={9.5} z={35} w={2.5} d={1} h={0.8} top="#3f3f46" left="#3f3f46" right="#3f3f46" />
        <Box x={-12} y={9.5} z={33} w={2.5} d={1} h={0.8} top="#3f3f46" left="#3f3f46" right="#3f3f46" />
        <Box x={9.5} y={9.5} z={35} w={2.5} d={1} h={0.8} top="#3f3f46" left="#3f3f46" right="#3f3f46" />
        <Box x={9.5} y={9.5} z={33} w={2.5} d={1} h={0.8} top="#3f3f46" left="#3f3f46" right="#3f3f46" />

        {acc === "glasses" && (
          <>
            <Box x={-8.5} y={10.2} z={35.5} w={6} d={1.5} h={5} top={accent} left={accent} right="rgba(56,189,248,0.35)" />
            <Box x={2.5} y={10.2} z={35.5} w={6} d={1.5} h={5} top={accent} left={accent} right="rgba(56,189,248,0.35)" />
            <Box x={-2.5} y={10.2} z={38} w={5} d={1.5} h={1.2} top={accent} left={accent} right={accent} />
          </>
        )}
        {acc === "headset" && (
          <>
            <Box x={-13} y={-2} z={35} w={2.5} d={6} h={7} top={accent} left="#0ea5e9" right={accent} />
            <Box x={10.5} y={-2} z={35} w={2.5} d={6} h={7} top={accent} left="#0ea5e9" right={accent} />
            <Box x={-12} y={-1} z={46} w={24} d={4} h={2.5} top="#18181b" left="#09090b" right="#27272a" />
          </>
        )}
        {acc === "beanie" && (
          <>
            <Box x={-11.5} y={-8.5} z={43} w={23} d={19} h={4} top="#e11d48" left="#9f1239" right="#be123c" />
            <Box x={-10} y={-7} z={47} w={20} d={16} h={4} top={accent} left="#eab308" right="#facc15" />
            <Box x={-3} y={-1} z={51} w={6} d={6} h={4} top="#ffffff" left="#cbd5e1" right="#e2e8f0" />
          </>
        )}
        {acc === "beret" && (
          <>
            <Box x={-10} y={-7} z={45} w={22} d={17} h={4} top={accent} left="#7e22ce" right="#9333ea" />
            <Box x={-2} y={0} z={49} w={4} d={4} h={2.5} top="#581c87" left="#581c87" right="#581c87" />
          </>
        )}
      </div>
    </div>
  );
}

function Workstation3D({
  lx,
  ly,
  agent,
  status,
  selected,
  onSelect,
}: {
  lx: number;
  ly: number;
  agent: Agent;
  status: Status;
  selected: boolean;
  onSelect: () => void;
}) {
  const on = status === "working";
  const dot = on ? "#fbbf24" : status === "done" ? "#34d399" : "#71717a";

  return (
    <div style={{ position: "absolute", inset: 0, ...P3D }}>
      <Box x={lx - 7} y={ly - 27} z={2} w={14} d={14} h={3} top="#1e293b" left="#0f172a" right="#0f172a" />
      <Box x={lx - 2} y={ly - 22} z={5} w={4} d={4} h={7} top="#334155" left="#1e293b" right="#0f172a" />
      <Box x={lx - 11} y={ly - 29} z={11} w={22} d={18} h={4} top="#334155" left="#0f172a" right="#1e293b" />
      <Box x={lx - 10} y={ly - 32} z={15} w={20} d={4} h={18} top="#475569" left="#0f172a" right="#1e293b" />

      <Cat3D x={lx} y={ly - 20} z={2} cast={CAST[agent.id]} status={status} onClick={onSelect} />

      <Box x={lx - 31} y={ly - 4} z={2} w={4} d={4} h={16} top="#334155" left="#0f172a" right="#1e293b" />
      <Box x={lx + 27} y={ly - 4} z={2} w={4} d={4} h={16} top="#334155" left="#0f172a" right="#1e293b" />
      <Box x={lx - 31} y={ly + 24} z={2} w={4} d={4} h={16} top="#334155" left="#0f172a" right="#1e293b" />
      <Box x={lx + 27} y={ly + 24} z={2} w={4} d={4} h={16} top="#334155" left="#0f172a" right="#1e293b" />
      <Box
        x={lx - 33}
        y={ly - 6}
        z={18}
        w={66}
        d={36}
        h={4}
        top={selected ? "#e0f2fe" : "#e2e8f0"}
        left="#64748b"
        right="#94a3b8"
        front="#cbd5e1"
      />

      <Box x={lx + 17} y={ly + 2} z={22} w={12} d={22} h={22} top="#1e293b" left="#090d16" right="#0f172a" front="#111827" />
      <Box x={lx + 16.5} y={ly + 5} z={26} w={1} d={14} h={14} top={on ? "#38bdf8" : "#0ea5e9"} left={on ? "#38bdf8" : "#0369a1"} right="#0284c7" />
      <Box x={lx + 21} y={ly + 24.2} z={40} w={4} d={1} h={1.5} top="#22c55e" left="#22c55e" right="#22c55e" />

      <Box x={lx - 11} y={ly + 14} z={22} w={16} d={8} h={1.5} top="#475569" left="#1e293b" right="#334155" />
      <Box x={lx - 5} y={ly + 17} z={23.5} w={4} d={3} h={7} top="#334155" left="#0f172a" right="#1e293b" />
      <Box
        x={lx - 19}
        y={ly + 15}
        z={28}
        w={32}
        d={3}
        h={19}
        top="#1e293b"
        left="#090d16"
        right="#0f172a"
        front="#0f172a"
        back={on ? "#0284c7" : "#1e293b"}
      />
      <Box
        x={lx - 17}
        y={ly + 14.2}
        z={30}
        w={28}
        d={1}
        h={15}
        top={on ? "#38bdf8" : "#0ea5e9"}
        left={on ? "#38bdf8" : "#0284c7"}
        right={on ? "#7dd3fc" : "#0369a1"}
      />
      <Box
        x={lx - 14}
        y={ly + 18.2}
        z={38}
        w={12}
        d={0.8}
        h={2}
        top={on ? "#fbbf24" : "#38bdf8"}
        left={on ? "#fbbf24" : "#38bdf8"}
        right={on ? "#fbbf24" : "#38bdf8"}
      />

      <Box x={lx - 14} y={ly + 1} z={22} w={18} d={8} h={2} top="#1e293b" left="#0f172a" right="#334155" />
      <Box x={lx - 12.5} y={ly + 2} z={24} w={15} d={5.5} h={0.8} top={on ? "#bae6fd" : "#f8fafc"} left="#cbd5e1" right="#e2e8f0" />
      <Box x={lx + 6} y={ly + 1} z={22} w={9} d={10} h={0.6} top="#0f172a" left="#090d16" right="#1e293b" />
      <Box x={lx + 8.5} y={ly + 3.5} z={22.6} w={4} d={6} h={2.2} top="#f8fafc" left="#94a3b8" right="#cbd5e1" />

      <Billboard x={lx} y={ly - 18} z={62} w={110} h={50} onClick={onSelect}>
        {on && (
          <div
            style={{
              background: "#fef08a",
              color: "#0f172a",
              borderRadius: 6,
              padding: "1px 6px",
              fontSize: 9,
              fontWeight: 800,
              fontFamily: "monospace",
              marginBottom: 3,
              boxShadow: "0 4px 10px rgba(0,0,0,0.45)",
            }}
          >
            WORKING...
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "2px 8px",
            borderRadius: 8,
            background: "rgba(5,8,17,.92)",
            fontSize: 10,
            fontWeight: 700,
            color: "#fff",
            outline: selected ? "2px solid #22d3ee" : "1px solid rgba(255,255,255,.22)",
            whiteSpace: "nowrap",
            boxShadow: "0 6px 14px rgba(0,0,0,0.5)",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 6, background: dot }} />
          {agent.name}
        </div>
      </Billboard>
    </div>
  );
}

function Room({
  pod,
  status,
  selectedId,
  onSelect,
  busy,
}: {
  pod: Pod;
  status: Record<string, Status>;
  selectedId: string;
  onSelect: (id: string) => void;
  busy: boolean;
}) {
  const [cx, cy] = pod.pos;
  const slots = slotsFor(pod.members.length);
  const workingCount = pod.members.filter((m) => status[m.id] === "working").length;

  return (
    <div
      style={{
        position: "absolute",
        left: cx - S / 2,
        top: cy - S / 2,
        width: S,
        height: S,
        ...P3D,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: pod.floor,
          borderRadius: 6,
          transform: "translateZ(2px)",
          border: `2px solid ${pod.edge}88`,
          boxShadow: busy ? `0 0 70px ${pod.glow}` : "0 16px 36px rgba(0,0,0,.75)",
          transition: "box-shadow .4s",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 16,
          top: 26,
          width: S - 36,
          height: S - 52,
          background: pod.rug,
          borderRadius: 8,
          transform: "translateZ(3px)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          padding: "8px 12px",
          fontFamily: "monospace",
          fontSize: 16,
          fontWeight: 900,
          color: "rgba(255,255,255,0.16)",
          letterSpacing: 1,
        }}
      >
        LPT·{pod.code}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: S,
          height: WALL_H,
          background: pod.wall,
          borderBottom: `3px solid ${pod.edge}`,
          transformOrigin: "0 0",
          transform: "rotateX(90deg)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 20,
            top: 16,
            width: 76,
            height: 36,
            background: "linear-gradient(180deg, #090d16 0%, #1e293b 100%)",
            border: `2px solid ${pod.edge}`,
            borderRadius: 3,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 112,
            top: 18,
            width: 54,
            height: 30,
            background: "rgba(255,255,255,.15)",
            border: "1.5px solid rgba(255,255,255,.4)",
            borderRadius: 2,
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: S,
          top: 0,
          width: WALL_H,
          height: S,
          background: pod.wall2,
          borderRight: `3px solid ${pod.edge}`,
          transformOrigin: "0 0",
          transform: "rotateY(-90deg)",
        }}
      />

      <Box x={S - 16} y={14} z={2} w={14} d={42} h={46} top={pod.edge} left="#0f172a" right="#1e293b" />

      {pod.members.map((m, i) => (
        <Workstation3D
          key={m.id}
          lx={slots[i]}
          ly={98}
          agent={m}
          status={status[m.id] ?? "idle"}
          selected={selectedId === m.id}
          onSelect={() => onSelect(m.id)}
        />
      ))}

      <Box x={14} y={S - 30} z={2} w={14} d={14} h={10} top="#7c4a2d" left="#5a341e" right="#6b3f26" />
      <Box x={12} y={S - 32} z={12} w={18} d={18} h={16} top="#4ade80" left="#15803d" right="#22c55e" />

      <Billboard x={S / 2} y={0} z={WALL_H + 16} w={175} h={46}>
        <div
          style={{
            background: "rgba(9,13,22,.94)",
            border: `1.5px solid ${pod.edge}`,
            borderRadius: 9,
            padding: "4px 10px",
            color: "#fff",
            whiteSpace: "nowrap",
            boxShadow: "0 8px 20px rgba(0,0,0,0.65)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: pod.edge }} />
            <span style={{ fontSize: 11, fontWeight: 700 }}>{pod.title}</span>
          </div>
          <div style={{ fontSize: 9, color: "#94a3b8", textAlign: "center", marginTop: 1 }}>
            {pod.members.length} agent · {workingCount} running
          </div>
        </div>
      </Billboard>
    </div>
  );
}

function Packet({
  from,
  to,
  color,
}: {
  from: [number, number];
  to: [number, number];
  color: string;
}) {
  const vars = {
    "--x0": `${from[0]}px`,
    "--y0": `${from[1]}px`,
    "--x1": `${to[0]}px`,
    "--y1": `${to[1]}px`,
  } as CSSProperties;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        ...P3D,
        animation: "fly 1.5s ease-in-out forwards",
        ...vars,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -7,
          top: -14,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 14px 4px ${color}`,
          transformOrigin: "50% 100%",
          transform: BB,
        }}
      />
    </div>
  );
}

export default function AgentHQ() {
  const [tab, setTab] = useState<Tab>("office");
  const [topicInput, setTopicInput] = useState("");
  const [activeTopic, setActiveTopic] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedId, setSelectedId] = useState("cmo");
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [taskText, setTaskText] = useState<Record<string, string>>({});
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [stageIdx, setStageIdx] = useState(-1);
  const [feed, setFeed] = useState<{ id: number; time: string; text: string }[]>([]);
  const [packets, setPackets] = useState<
    { id: number; from: [number, number]; to: [number, number]; color: string }[]
  >([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [openReport, setOpenReport] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [fit, setFit] = useState(0.75);
  const [pan, setPan] = useState<[number, number]>([0, 20]);
  const [isDragging, setIsDragging] = useState(false);

  // State Dialog Revisi Khusus Per-Agen
  const [revisionTarget, setRevisionTarget] = useState<{
    reportId: number;
    agentId: string;
    agentName: string;
    agentRole: string;
    topic: string;
    prevContext: string;
  } | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [isRevising, setIsRevising] = useState(false);

  const dragStart = useRef<[number, number]>([0, 0]);
  const timers = useRef<number[]>([]);
  const uid = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lpt_agent_reports");
      if (saved) setReports(JSON.parse(saved));
    } catch (err) {
      console.warn("Storage disabled");
    }
  }, []);

  const saveReportsToStorage = (updated: Report[]) => {
    setReports(updated);
    try {
      localStorage.setItem("lpt_agent_reports", JSON.stringify(updated));
    } catch (err) {
      console.warn("Storage error");
    }
  };

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      setFit(Math.max(0.38, Math.min(el.clientWidth / 1150, el.clientHeight / 760)))
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, [tab]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const now = () =>
    new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const after = (ms: number, fn: () => void) =>
    timers.current.push(window.setTimeout(fn, ms));

  const startRun = async (e: React.FormEvent) => {
    e.preventDefault();
    const topic = topicInput.trim();
    if (!topic || isProcessing) return;

    setIsProcessing(true);
    setActiveTopic(topic);
    setStatus({});
    setTaskText({});
    setOutputs({});
    setPackets([]);
    setStageIdx(-1);
    setTopicInput("");

    try {
      const res = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const block of lines) {
          const matchEvent = block.match(/event: (.+)/);
          const matchData = block.match(/data: (.+)/);
          if (!matchEvent || !matchData) continue;

          const eventType = matchEvent[1].trim();
          const data = JSON.parse(matchData[1].trim());

          if (eventType === "stage") {
            setStageIdx(data.stageIdx);
            setFeed((f) => [
              { id: ++uid.current, time: now(), text: data.label },
              ...f,
            ].slice(0, 40));

            setStatus((prev) => {
              const next = { ...prev };
              Object.entries(data.actors).forEach(
                ([id, [s]]: [string, any]) => (next[id] = s)
              );
              return next;
            });

            setTaskText((prev) => {
              const next = { ...prev };
              Object.entries(data.actors).forEach(
                ([id, [, t]]: [string, any]) => t && (next[id] = t)
              );
              return next;
            });

            if (data.flows) {
              data.flows.forEach(([a, b]: [string, string]) => {
                const pid = ++uid.current;
                const color =
                  a === "cmo"
                    ? "#22d3ee"
                    : POD_OF[a]?.division === "Web Media"
                    ? "#38bdf8"
                    : "#facc15";
                setPackets((p) => [...p, { id: pid, from: POS[a], to: POS[b], color }]);
                after(1600, () =>
                  setPackets((p) => p.filter((x) => x.id !== pid))
                );
              });
            }

            if (data.final && data.reportSections) {
              const newRep: Report = {
                id: ++uid.current,
                topic,
                time: now(),
                status: "pending",
                sections: data.reportSections,
              };
              saveReportsToStorage([newRep, ...reports]);
              setIsProcessing(false);
              setTab("approvals");
            }
          } else if (eventType === "agent_done") {
            setStatus((prev) => ({ ...prev, [data.id]: "done" }));
            setOutputs((prev) => ({ ...prev, [data.id]: data.output }));
          }
        }
      }
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  // Fungsi Eksekusi Revisi Spesifik Satu Agen
  const submitSingleRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionTarget || !revisionFeedback.trim() || isRevising) return;

    const { reportId, agentId, agentName, topic, prevContext } = revisionTarget;
    setIsRevising(true);

    // Ubah status agen di 3D office menjadi WORKING (ngetik lagi)
    setStatus((prev) => ({ ...prev, [agentId]: "working" }));
    setTaskText((prev) => ({ ...prev, [agentId]: `Mengerjakan revisi CEO: "${revisionFeedback}"` }));
    setFeed((f) => [
      { id: ++uid.current, time: now(), text: `CEO R menginstruksikan revisi ke ${agentName}` },
      ...f,
    ]);

    // Beri animasi packet dari War Room CMO ke meja agen tersebut
    const pid = ++uid.current;
    setPackets((p) => [...p, { id: pid, from: POS.cmo, to: POS[agentId], color: "#fb923c" }]);
    after(1600, () => setPackets((p) => p.filter((x) => x.id !== pid)));

    try {
      const res = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "single_revision",
          agentId,
          topic,
          feedback: revisionFeedback,
          prevContext,
        }),
      });

      const result = await res.json();
      if (result.output) {
        // Update data spesifik di dalam laporan
        const updatedReports = reports.map((r) => {
          if (r.id === reportId) {
            return {
              ...r,
              sections: r.sections.map((sec) =>
                sec.id === agentId ? { ...sec, text: result.output } : sec
              ),
            };
          }
          return r;
        });

        saveReportsToStorage(updatedReports);
        setStatus((prev) => ({ ...prev, [agentId]: "done" }));
        setOutputs((prev) => ({ ...prev, [agentId]: result.output }));
        setFeed((f) => [
          { id: ++uid.current, time: now(), text: `${agentName} selesai merevisi tugas` },
          ...f,
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRevising(false);
      setRevisionTarget(null);
      setRevisionFeedback("");
    }
  };

  const handleUpdateApproval = async (id: number, decision: "approved" | "rejected") => {
    const targetReport = reports.find((r) => r.id === id);
    
    if (decision === "approved" && targetReport) {
      setFeed((f) => [
        { id: Date.now() + Math.random(), time: now(), text: `CEO R approve draf. Mengunggah ke Google Drive 5TB...` },
        ...f,
      ]);

      try {
        const res = await fetch("/api/drive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "upload_approved",
            topic: targetReport.topic,
            sections: targetReport.sections,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setFeed((f) => [
            { id: Date.now() + Math.random(), time: now(), text: `Aset berhasil diarsipkan ke Google Drive!` },
            ...f,
          ]);
        }
      } catch (err) {
        console.error("Gagal sinkronisasi Drive", err);
      }
    }

    const updated = reports.map((r) => (r.id === id ? { ...r, status: decision } : r));
    saveReportsToStorage(updated);
  };

  const handleMouseDown = (e: ReactMouseEvent) => {
    setIsDragging(true);
    dragStart.current = [e.clientX - pan[0], e.clientY - pan[1]];
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (!isDragging) return;
    setPan([e.clientX - dragStart.current[0], e.clientY - dragStart.current[1]]);
  };

  const handleMouseUp = () => setIsDragging(false);

  const totalAgents = Object.keys(AGENTS).length;
  const runningAgents = Object.values(status).filter((s) => s === "working").length;
  const pendingApprovals = reports.filter((r) => r.status === "pending").length;
  const sel = AGENTS[selectedId];
  const selStatus = status[selectedId] ?? "idle";
  const selPod = POD_OF[selectedId];
  const selCast = CAST[selectedId];
  const brainNotes = 128 + reports.length * 6;

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "office", label: "Office" },
    {
      id: "approvals",
      label: "Approvals",
      badge: pendingApprovals > 0 ? pendingApprovals : undefined,
    },
    { id: "reports", label: "Reports", badge: reports.length || undefined },
    { id: "brain", label: "Brain" },
  ];

  return (
    <div className="h-screen bg-[#060911] text-zinc-100 flex flex-col font-sans overflow-hidden select-none">
      <style>{`
        @keyframes bob3d{0%,100%{transform:translateZ(0)}50%{transform:translateZ(3px)}}
        @keyframes pawType{0%,100%{transform:translateZ(0)}50%{transform:translateZ(-2.5px)}}
        @keyframes wag3d{0%,100%{transform:rotateZ(-8deg)}50%{transform:rotateZ(10deg)}}
        @keyframes ring{0%{transform:scale(.55);opacity:.85}100%{transform:scale(1.35);opacity:0}}
        @keyframes fly{from{transform:translate3d(var(--x0),var(--y0),52px)}to{transform:translate3d(var(--x1),var(--y1),52px)}}
        .bob3d{animation:bob3d .35s ease-in-out infinite}
        .pawL{animation:pawType .22s ease-in-out infinite}
        .pawR{animation:pawType .22s .11s ease-in-out infinite}
        .wag3d{animation:wag3d 2s ease-in-out infinite}
        @media (prefers-reduced-motion:reduce){.soft{animation:none!important}}
      `}</style>

      {/* Top Bar Header */}
      <header className="border-b border-zinc-800/80 bg-[#090d16]/95 px-5 py-2.5 flex items-center justify-between z-30 gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#111827] border border-zinc-700/80 rounded-full px-3 py-1 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="font-bold text-zinc-200">01 · THE OFFICE</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="font-semibold text-sm text-white">LuPerluTau</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 border border-zinc-700 font-mono">
              HQ AUTONOMOUS
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-[#0c121e] border border-zinc-800 rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                tab === t.id
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t.label}
              {t.badge ? (
                <span
                  className={`text-[10px] px-1.5 rounded font-mono ${
                    t.id === "approvals"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                      : "bg-cyan-500/20 text-cyan-300"
                  }`}
                >
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2.5 text-xs">
          <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-700/50 px-3 py-1 rounded-full text-emerald-300 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              {totalAgents} agents · {runningAgents} running
            </span>
          </div>
          <div className="bg-zinc-800 text-zinc-200 border border-zinc-700 px-3 py-1 rounded-full font-medium">
            CEO: R
          </div>
        </div>
      </header>

      {/* CEO Command Bar */}
      <div className="px-6 py-2.5 bg-[#080b12] border-b border-zinc-800/80 z-20 shrink-0">
        <form onSubmit={startRun} className="max-w-4xl mx-auto flex gap-2">
          <input
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            placeholder="Ketik topik review produk (contoh: Review Salomon XT-6)..."
            disabled={isProcessing}
            className="flex-1 bg-[#04060a] border border-zinc-700/80 rounded-lg px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
          />
          <button
            type="submit"
            disabled={isProcessing || !topicInput.trim()}
            className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-slate-950 font-semibold px-5 py-2 rounded-lg text-xs uppercase tracking-wider transition cursor-pointer disabled:cursor-not-allowed"
          >
            {isProcessing ? "Menjalankan Hermes 3..." : "Deploy Brief"}
          </button>
        </form>
      </div>

      {/* Tab 1: THE OFFICE */}
      {tab === "office" && (
        <main className="flex-1 flex min-h-0">
          <div
            ref={stageRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`flex-1 relative overflow-hidden ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{
              background:
                "radial-gradient(ellipse at 50% 45%, #10192b 0%, #060911 72%)",
            }}
          >
            <div className="absolute right-4 top-4 w-64 space-y-2 z-20 pointer-events-none">
              {feed.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="bg-[#090d16]/90 border border-zinc-700/80 rounded-xl p-2.5 shadow-xl backdrop-blur"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400">
                    <span>LIVE EVENT</span>
                    <span className="text-zinc-500">{item.time}</span>
                  </div>
                  <p className="text-xs text-zinc-200 mt-1 line-clamp-2">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            <div
              style={{
                position: "absolute",
                left: `calc(50% + ${pan[0]}px)`,
                top: `calc(52% + ${pan[1]}px)`,
                width: 0,
                height: 0,
                transform: `scale(${fit * zoom})`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: 0,
                  height: 0,
                  ...P3D,
                  transform: "rotateX(60deg) rotateZ(-45deg)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: -440,
                    top: -440,
                    width: 880,
                    height: 880,
                    borderRadius: "50%",
                    border: "1px dashed rgba(148,163,184,0.16)",
                    transform: "translateZ(0px)",
                  }}
                />

                {PODS.map((p) => {
                  const [cx, cy] = p.pos;
                  const len = Math.hypot(cx, cy);
                  const ang = (Math.atan2(cy, cx) * 180) / Math.PI;
                  const podBusy =
                    isProcessing &&
                    p.members.some((m) => status[m.id] === "working");
                  return (
                    <div
                      key={`bridge-${p.id}`}
                      style={{
                        position: "absolute",
                        left: 0,
                        top: -12,
                        width: len,
                        height: 24,
                        transformOrigin: "0 50%",
                        transform: `translateZ(1px) rotate(${ang}deg)`,
                        background:
                          "linear-gradient(90deg, rgba(15,23,42,0.9), rgba(30,41,59,0.75))",
                        borderTop: `1.5px solid ${
                          podBusy ? p.edge : "rgba(148,163,184,0.25)"
                        }`,
                        borderBottom: `1.5px solid ${
                          podBusy ? p.edge : "rgba(148,163,184,0.25)"
                        }`,
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: 2,
                          marginTop: 10,
                          background: `repeating-linear-gradient(90deg, ${p.edge}88 0 12px, transparent 12px 24px)`,
                        }}
                      />
                    </div>
                  );
                })}

                {PODS.map((p) => (
                  <Room
                    key={p.id}
                    pod={p}
                    status={status}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    busy={
                      isProcessing &&
                      p.members.some((m) => status[m.id] === "working")
                    }
                  />
                ))}

                <div
                  style={{
                    position: "absolute",
                    left: -115,
                    top: -115,
                    width: 230,
                    height: 230,
                    borderRadius: "50%",
                    transform: "translateZ(3px)",
                    background:
                      "radial-gradient(circle, rgba(14,165,233,0.35) 0%, rgba(7,17,29,0.95) 65%, #07111d 100%)",
                    border: "3px solid rgba(56,189,248,0.65)",
                    boxShadow: "0 0 80px rgba(56,189,248,0.4)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: -85,
                    top: -85,
                    width: 170,
                    height: 170,
                    borderRadius: "50%",
                    border: "2px solid rgba(56,189,248,0.45)",
                    transform: "translateZ(5px)",
                  }}
                />

                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="soft"
                    style={{
                      position: "absolute",
                      left: -115,
                      top: -115,
                      width: 230,
                      height: 230,
                      borderRadius: "50%",
                      border: "2px solid #38bdf8",
                      transform: "translateZ(6px)",
                      animation: isProcessing
                        ? `ring 2.2s ${i * 1.1}s infinite`
                        : "none",
                      opacity: 0,
                    }}
                  />
                ))}

                <Workstation3D
                  lx={0}
                  ly={8}
                  agent={CMO}
                  status={status.cmo ?? "idle"}
                  selected={selectedId === "cmo"}
                  onSelect={() => setSelectedId("cmo")}
                />

                <Billboard x={0} y={-55} z={115} w={185} h={45}>
                  <button
                    onClick={() => setTab("brain")}
                    className="bg-[#050811]/95 border border-cyan-400/60 rounded-lg px-3.5 py-1.5 text-center cursor-pointer hover:border-cyan-300 transition shadow-2xl"
                  >
                    <div className="text-[10px] font-bold text-cyan-300 tracking-wider">
                      THE BRAIN · WAR ROOM
                    </div>
                    <div className="text-[9px] text-zinc-300 font-mono">
                      {brainNotes} notes · shared memory
                    </div>
                  </button>
                </Billboard>

                {packets.map((p) => (
                  <Packet key={p.id} from={p.from} to={p.to} color={p.color} />
                ))}
              </div>
            </div>

            <div className="absolute left-4 top-4 text-[11px] text-zinc-400 bg-[#090d16]/80 border border-zinc-800 px-3 py-1.5 rounded-lg z-10 pointer-events-none">
              Geser kanvas untuk navigasi · Klik kucing 3D atau meja PC untuk buka Inspector
            </div>

            <div className="absolute right-4 bottom-4 bg-[#090d16]/95 border border-zinc-700/80 rounded-xl p-2.5 z-20 shadow-2xl w-36">
              <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 mb-1.5">
                <span>MAP</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <div className="relative w-full h-20 bg-[#05070c] border border-zinc-800 rounded-lg mb-2 overflow-hidden">
                <button
                  onClick={() => {
                    setSelectedId("cmo");
                    setPan([0, 20]);
                  }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-400 cursor-pointer"
                  title="The Brain (Mochi)"
                />
                {PODS.map((p) => {
                  const mx = 50 + (p.pos[0] / 440) * 38;
                  const my = 50 + (p.pos[1] / 440) * 38;
                  return (
                    <button
                      key={`map-${p.id}`}
                      onClick={() => setSelectedId(p.members[0].id)}
                      style={{
                        left: `${mx}%`,
                        top: `${my}%`,
                        background: p.edge,
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2 rounded-xs cursor-pointer hover:scale-125 transition"
                      title={p.title}
                    />
                  );
                })}
              </div>
              <div className="flex gap-1 justify-between">
                {[
                  ["−", () => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2)))],
                  ["+", () => setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(2)))],
                  [
                    "⟲",
                    () => {
                      setZoom(1);
                      setPan([0, 20]);
                    },
                  ],
                ].map(([label, fn]) => (
                  <button
                    key={label as string}
                    onClick={fn as () => void}
                    className="flex-1 py-1 rounded bg-[#111827] border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs font-bold cursor-pointer"
                  >
                    {label as string}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="w-80 shrink-0 border-l border-zinc-800 bg-[#090d16] flex flex-col min-h-0 z-20">
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  Agent Inspector
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded border font-mono ${
                    selStatus === "working"
                      ? "bg-amber-950 text-amber-300 border-amber-600"
                      : selStatus === "done"
                      ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  }`}
                >
                  {selStatus === "working"
                    ? "WORKING"
                    : selStatus === "done"
                    ? "DONE"
                    : "IDLE"}
                </span>
              </div>

              <div className="flex gap-3 items-center">
                <div className="w-16 h-16 rounded-lg bg-[#050811] border border-zinc-800 relative overflow-hidden flex items-center justify-center shrink-0">
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "78%",
                      width: 0,
                      height: 0,
                      transform: "scale(0.85)",
                    }}
                  >
                    <div style={{ ...P3D, transform: "rotateX(60deg) rotateZ(-45deg)" }}>
                      <Cat3D x={0} y={0} z={-10} cast={selCast} status={selStatus} />
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-bold text-white leading-tight">
                    {sel.name}
                  </h4>
                  <p className="text-cyan-400 text-[11px] font-mono">{sel.role}</p>
                  <p className="text-zinc-500 text-[11px]">
                    {selPod
                      ? `${selPod.title} · ${selPod.division}`
                      : "The Brain · Central Hub"}
                  </p>
                </div>
              </div>

              <div className="mt-3 text-xs space-y-2">
                <div>
                  <div className="text-zinc-500 text-[10px] uppercase font-mono mb-0.5">
                    Spesifikasi Workstation
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono bg-[#050811] px-2.5 py-1.5 rounded border border-zinc-800/80">
                    PC Tower Rig · Widescreen Monitor · Mech Keyboard & Mouse
                  </p>
                </div>

                <div>
                  <div className="text-zinc-500 text-[10px] uppercase font-mono mb-0.5">
                    Fokus Saat Ini
                  </div>
                  <p className="bg-[#050811] p-2.5 rounded border border-zinc-800 leading-relaxed text-zinc-200">
                    {selStatus === "working"
                      ? taskText[selectedId]
                      : selStatus === "done"
                      ? "Tugas selesai, output tersimpan di memori."
                      : sel.activity}
                  </p>
                </div>

                {outputs[selectedId] && (
                  <div>
                    <div className="text-zinc-500 text-[10px] uppercase font-mono mb-0.5">
                      Output Hermes 3 (Nyata)
                    </div>
                    <p className="bg-emerald-950/30 text-emerald-200 p-2.5 rounded border border-emerald-900 leading-relaxed max-h-40 overflow-y-auto">
                      {outputs[selectedId]}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col p-4">
              <div className="text-xs font-semibold text-zinc-300 mb-2">
                Log Orkestrasi Langsung
              </div>
              <ul className="flex-1 overflow-y-auto space-y-2 pr-1 text-[11px]">
                {feed.length === 0 && (
                  <li className="text-zinc-500">
                    Belum ada aktivitas. Masukkan topik di bilah atas untuk memicu Hermes 3.
                  </li>
                )}
                {feed.map((f) => (
                  <li
                    key={f.id}
                    className="bg-[#050811] border border-zinc-800 rounded-md p-2"
                  >
                    <span className="text-zinc-500 font-mono">{f.time}</span>
                    <p className="text-zinc-200 mt-0.5">{f.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </main>
      )}

      {/* Tab 2: APPROVALS (Human-In-The-Loop dengan Tombol Revisi Per-Divisi) */}
      {tab === "approvals" && (
        <main className="flex-1 overflow-y-auto p-6 bg-[#050811]">
          <div className="max-w-4xl mx-auto space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">CEO Approval Desk</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Setiap hasil kerja divisi dapat disetujui, ditolak, atau direvisi per-agen secara spesifik.
              </p>
            </div>

            {reports.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-[#090d16] p-8 text-center text-xs text-zinc-500">
                Antrean persetujuan kosong. Deploy brief dari tab Office untuk menerima draf baru.
              </div>
            ) : (
              reports.map((item, idx) => (
                <div
                  key={`approval-${item.id}-${idx}`}
                  className={`rounded-xl border p-5 bg-[#090d16] space-y-4 ${
                    item.status === "pending"
                      ? "border-amber-500/50 shadow-lg shadow-amber-950/20"
                      : item.status === "approved"
                      ? "border-emerald-600/40 opacity-90"
                      : "border-rose-900/40 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div>
                      <span className="text-xs font-mono text-zinc-500">{item.time}</span>
                      <h3 className="text-sm font-bold text-white mt-0.5">{item.topic}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${
                          item.status === "pending"
                            ? "bg-amber-950 text-amber-300 border border-amber-600/50"
                            : item.status === "approved"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-600/50"
                            : "bg-rose-950 text-rose-300 border border-rose-600/50"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Grid Output Tiap Agen dengan Tombol Revisi Mandiri */}
                  <div className="grid md:grid-cols-2 gap-3">
                    {item.sections.map((sec) => (
                      <div
                        key={sec.id}
                        className="bg-[#050811] border border-zinc-800/80 rounded-lg p-3 text-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-cyan-400">
                              {sec.name} <span className="text-zinc-500 font-normal">({sec.role})</span>
                            </span>
                            {item.status === "pending" && (
                              <button
                                onClick={() =>
                                  setRevisionTarget({
                                    reportId: item.id,
                                    agentId: sec.id,
                                    agentName: sec.name,
                                    agentRole: sec.role,
                                    topic: item.topic,
                                    prevContext: sec.text,
                                  })
                                }
                                className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-amber-600/40 hover:bg-zinc-700 transition cursor-pointer"
                              >
                                Revisi Bagian Ini
                              </button>
                            )}
                          </div>
                          <p className="text-zinc-300 whitespace-pre-line leading-relaxed text-[11px]">
                            {sec.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {item.status === "pending" && (
                    <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/80">
                      <button
                        onClick={() => handleUpdateApproval(item.id, "rejected")}
                        className="px-4 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white text-xs cursor-pointer"
                      >
                        Tolak Seluruh Draf
                      </button>
                      <button
                        onClick={() => handleUpdateApproval(item.id, "approved")}
                        className="px-5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs cursor-pointer transition shadow-md shadow-emerald-950"
                      >
                        Approve & Rilis Konten
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </main>
      )}

      {/* Tab 3: REPORTS */}
      {tab === "reports" && (
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-3">
            <h2 className="text-sm font-semibold text-white">
              Arsip Laporan & Riwayat Eksekusi
            </h2>
            {reports.length === 0 && (
              <p className="text-xs text-zinc-500">
                Belum ada arsip tersimpan. Jalankan brief dari tab Office untuk mencatat laporan di sini.
              </p>
            )}
            {reports.map((r, idx) => (
              <article
                key={`report-${r.id}-${idx}`}
                className="rounded-xl border border-zinc-800 bg-[#0a0f1a] overflow-hidden"
              >
                <button
                  onClick={() => setOpenReport(openReport === r.id ? null : r.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-900/50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        r.status === "approved"
                          ? "bg-emerald-400"
                          : r.status === "rejected"
                          ? "bg-rose-500"
                          : "bg-amber-400"
                      }`}
                    />
                    <span className="text-sm font-semibold text-white">{r.topic}</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">{r.time}</span>
                </button>
                {openReport === r.id && (
                  <div className="px-4 pb-4 grid gap-2 border-t border-zinc-800/80 pt-3">
                    {r.sections.map((s) => (
                      <div
                        key={s.id}
                        className="text-xs bg-[#050811] border border-zinc-800 rounded-md p-3"
                      >
                        <div className="text-cyan-400 mb-0.5 font-semibold">
                          {s.name} <span className="text-zinc-500 font-normal">· {s.role}</span>
                        </div>
                        <p className="text-zinc-200 leading-relaxed whitespace-pre-line">{s.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </main>
      )}

      {/* Tab 4: THE BRAIN */}
      {tab === "brain" && (
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="rounded-xl border border-cyan-900 bg-cyan-950/20 p-5 mb-4">
              <div className="text-3xl font-bold text-white font-mono">
                {brainNotes}
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Catatan di dalam Shared Memory. Seluruh agen membaca riwayat produk di bawah agar tidak melakukan riset berulang.
              </p>
            </div>
            <h2 className="text-sm font-semibold mb-2 text-white">
              Memori Terkini (Local Persistent DB)
            </h2>
            <ul className="space-y-2">
              {reports.length === 0 && (
                <li className="text-xs text-zinc-500">
                  Belum ada catatan memori tersimpan.
                </li>
              )}
              {reports
                .flatMap((r) =>
                  r.sections.map((s) => ({
                    ...s,
                    topic: r.topic,
                    reportId: r.id,
                  }))
                )
                .slice(0, 20)
                .map((n, idx) => (
                  <li
                    key={`brain-note-${n.reportId}-${n.id}-${idx}`}
                    className="text-xs bg-[#0a0f1a] border border-zinc-800 rounded-md p-3"
                  >
                    <span className="text-cyan-400 font-semibold">{n.name}</span>{" "}
                    <span className="text-zinc-500">· {n.topic}</span>
                    <p className="text-zinc-300 mt-0.5 leading-relaxed">{n.text}</p>
                  </li>
                ))}
            </ul>
          </div>
        </main>
      )}

      {/* Modal Popup Input Revisi Spesifik Satu Agen */}
      {revisionTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#090d16] border border-zinc-700/80 rounded-xl p-5 max-w-lg w-full shadow-2xl space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-amber-400">Instruksi Khusus CEO R</span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Revisi Tugas: {revisionTarget.agentName} ({revisionTarget.agentRole})
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">Topik: {revisionTarget.topic}</p>
            </div>

            <div className="text-xs bg-[#050811] border border-zinc-800 p-2.5 rounded text-zinc-400 max-h-24 overflow-y-auto">
              <span className="text-[10px] font-mono text-zinc-500 block mb-0.5">DRAF SAAT INI:</span>
              {revisionTarget.prevContext}
            </div>

            <form onSubmit={submitSingleRevision} className="space-y-3">
              <textarea
                value={revisionFeedback}
                onChange={(e) => setRevisionFeedback(e.target.value)}
                placeholder="Tulis apa yang perlu diubah (misal: 'Bikin headlinenya lebih provokatif' atau 'Fokusin ulasannya ke kenyamanan sol')..."
                rows={3}
                disabled={isRevising}
                className="w-full bg-[#04060a] border border-zinc-700 rounded-lg p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isRevising}
                  onClick={() => setRevisionTarget(null)}
                  className="px-4 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isRevising || !revisionFeedback.trim()}
                  className="px-5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-slate-950 font-semibold text-xs cursor-pointer transition"
                >
                  {isRevising ? "Hermes 3 Merevisi..." : "Kirim Revisi ke Agen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}