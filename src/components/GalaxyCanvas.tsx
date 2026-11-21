import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { MoodEntry } from "../types";
import { NEUTRAL_PALETTE, getMood } from "../data/moods";
import { hashString, mulberry32 } from "../lib/seededRandom";
import { sizeCanvas } from "../lib/particles";
import { useAnimationFrame } from "../hooks/useAnimationFrame";
import { useLatestRef } from "../hooks/useLatestRef";

interface GalaxyCanvasProps {
  entries: readonly MoodEntry[];
  reducedMotion: boolean;
}

interface Tip {
  id: string;
  x: number;
  y: number;
}

interface Placed {
  entry: MoodEntry;
  x: number;
  y: number;
  r: number;
  color: string;
}

interface Star {
  x: number;
  y: number;
  r: number;
  a: number;
}

/**
 * Positions come only from the entry id, so a saved mood always
 * lands on the same spot in the galaxy.
 */
function placeOrbs(entries: readonly MoodEntry[], w: number, h: number): Placed[] {
  return entries.map((entry) => {
    const rand = mulberry32(hashString(entry.id));
    const angle = rand() * Math.PI * 2;
    const dist = Math.sqrt(rand());
    const mood = getMood(entry.mood);
    return {
      entry,
      x: w / 2 + Math.cos(angle) * dist * w * 0.36,
      y: h * 0.56 + Math.sin(angle) * dist * h * 0.3,
      r: 7 + entry.intensity * 4.5,
      color: mood?.palette.particle ?? NEUTRAL_PALETTE.particle,
    };
  });
}

function formatWhen(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

export function GalaxyCanvas({ entries, reducedMotion }: GalaxyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const entriesRef = useLatestRef(entries);
  const reducedRef = useLatestRef(reducedMotion);
  const starsRef = useRef<{ key: string; stars: Star[] }>({ key: "", stars: [] });
  const clockRef = useRef(0);
  const [tip, setTip] = useState<Tip | null>(null);
  const [hot, setHot] = useState(false);

  useAnimationFrame((dt) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = ctxRef.current ?? canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    ctxRef.current = ctx;
    const size = sizeCanvas(canvas, ctx);
    if (!size) return;
    const { w, h } = size;

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "#070910");
    gradient.addColorStop(1, "#151a2c");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    const key = `${Math.round(w)}x${Math.round(h)}`;
    if (starsRef.current.key !== key) {
      const rand = mulberry32(0x51ed0);
      starsRef.current = {
        key,
        stars: Array.from({ length: 80 }, () => ({
          x: rand() * w,
          y: rand() * h,
          r: 0.4 + rand() * 1.3,
          a: 0.18 + rand() * 0.55,
        })),
      };
    }
    for (const star of starsRef.current.stars) {
      ctx.globalAlpha = star.a;
      ctx.fillStyle = "#d5def2";
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    clockRef.current += dt;
    const orbs = placeOrbs(entriesRef.current, w, h).sort((a, b) => a.r - b.r);
    orbs.forEach((orb, index) => {
      const pulse = reducedRef.current ? 1 : 1 + Math.sin(clockRef.current * 1.4 + index) * 0.08;
      const radius = orb.r * pulse;
      const glow = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, radius * 3.1);
      glow.addColorStop(0, orb.color);
      glow.addColorStop(0.35, withAlpha(orb.color, 0.45));
      glow.addColorStop(1, withAlpha(orb.color, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, radius * 3.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fffef8";
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, Math.max(1.5, radius * 0.28), 0, Math.PI * 2);
      ctx.fill();
    });

  });

  const tipEntry = tip ? entries.find((entry) => entry.id === tip.id) : undefined;

  function hitTest(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const orbs = placeOrbs(entriesRef.current, rect.width, rect.height);
    let best: Placed | null = null;
    let bestDist = Infinity;
    for (const orb of orbs) {
      const dist = Math.hypot(orb.x - x, orb.y - y);
      if (dist <= orb.r * 2.6 + 12 && dist < bestDist) {
        best = orb;
        bestDist = dist;
      }
    }
    setHot(best !== null);
    setTip(best ? { id: best.entry.id, x: event.clientX, y: event.clientY } : null);
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className={hot ? "bg-canvas galaxy-hit is-hot" : "bg-canvas galaxy-hit"}
        role="img"
        aria-label="Mood galaxy. Each glowing orb is a logged mood. Hover or tap an orb for details."
        onPointerMove={hitTest}
        onPointerDown={hitTest}
        onPointerLeave={(event) => {
          if (event.pointerType !== "mouse") return;
          setTip(null);
          setHot(false);
        }}
      />
      {tip && tipEntry && (
        <div
          className="tooltip glass"
          role="tooltip"
          style={{
            left: Math.min(window.innerWidth - 20, Math.max(20, tip.x)),
            top: tip.y,
            transform: tip.y < 140 ? "translate(-50%, 16px)" : "translate(-50%, calc(-100% - 14px))",
          }}
        >
          <p className="entry-title">
            <span aria-hidden="true">{getMood(tipEntry.mood)?.emoji ?? "✨"}</span>
            {getMood(tipEntry.mood)?.label ?? tipEntry.mood}
          </p>
          <p className="meta">
            {formatWhen(tipEntry.timestamp)} · Intensity {tipEntry.intensity}
          </p>
          <p className="note">{tipEntry.note || "No note"}</p>
        </div>
      )}
    </>
  );
}

function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
