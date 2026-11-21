import type { Mood, ParticleConfig, ParticleDirection, ParticleShape } from "../types";
import { NEUTRAL_PALETTE, NEUTRAL_PARTICLES } from "../data/moods";

export interface Scene {
  id: string;
  shape: ParticleShape;
  direction: ParticleDirection;
  count: number;
  speed: number;
  size: number;
  bgTop: string;
  bgBottom: string;
  particle: string;
  glow: string;
  centerGlow: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  seed: number;
  alpha: number;
  dying: boolean;
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

const TWO_PI = Math.PI * 2;

export function buildScene(mood: Mood | null, intensity: number, reduced: boolean): Scene {
  const particles: ParticleConfig = mood ? mood.particles : NEUTRAL_PARTICLES;
  const palette = mood ? mood.palette : NEUTRAL_PALETTE;
  const level = Math.min(5, Math.max(1, intensity));
  let count = Math.round(particles.count * (0.5 + level * 0.2));
  let speed = particles.speed * (0.6 + level * 0.16);
  if (reduced) {
    count = Math.max(6, Math.round(count * 0.28));
    speed *= 0.35;
  }
  return {
    id: mood?.id ?? "neutral",
    shape: particles.shape,
    direction: particles.direction,
    count: Math.min(160, count),
    speed,
    size: particles.size,
    bgTop: palette.bgTop,
    bgBottom: palette.bgBottom,
    particle: palette.particle,
    glow: palette.glow,
    centerGlow: particles.shape === "lines",
  };
}

export function createParticle(scene: Scene, fadeIn: boolean): Particle {
  const mag = scene.speed * 0.16;
  const jitter = (Math.random() - 0.5) * mag;
  let vx = 0;
  let vy = 0;
  switch (scene.direction) {
    case "up":
      vx = jitter * 0.7;
      vy = -mag * (0.75 + Math.random() * 0.55);
      break;
    case "down":
      vx = jitter * 0.25;
      vy = mag * (0.8 + Math.random() * 0.6);
      break;
    case "float":
      vx = jitter * 0.25;
      vy = -mag * (0.35 + Math.random() * 0.45);
      break;
    case "across":
      vx = mag * (0.7 + Math.random()) * (Math.random() < 0.5 ? -1 : 1);
      vy = jitter * 0.08;
      break;
    case "wander": {
      const angle = Math.random() * TWO_PI;
      vx = Math.cos(angle) * mag;
      vy = Math.sin(angle) * mag;
      break;
    }
    default:
      vx = (Math.random() - 0.5) * mag * 1.3;
      vy = (Math.random() - 0.5) * mag * 1.3;
  }

  return {
    x: Math.random(),
    y: Math.random(),
    vx,
    vy,
    size: scene.size * (0.55 + Math.random() * 0.9),
    phase: Math.random() * TWO_PI,
    seed: Math.random() * 100,
    alpha: fadeIn ? 0 : 1,
    dying: false,
  };
}

export function syncPopulation(particles: Particle[], count: number, scene: Scene, fadeIn: boolean): void {
  let living = 0;
  for (const particle of particles) {
    if (!particle.dying) living += 1;
  }
  if (living > count) {
    let extra = living - count;
    for (let i = particles.length - 1; i >= 0 && extra > 0; i--) {
      const particle = particles[i];
      if (particle && !particle.dying) {
        particle.dying = true;
        extra -= 1;
      }
    }
  } else if (living < count) {
    for (let i = living; i < count; i++) particles.push(createParticle(scene, fadeIn));
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    if (particle && particle.dying && particle.alpha <= 0.02) particles.splice(i, 1);
  }
}

export function stepParticle(particle: Particle, scene: Scene, dt: number, time: number): void {
  if (scene.direction === "wander" || scene.shape === "fireflies") {
    const max = scene.speed * (scene.shape === "fireflies" ? 0.3 : 0.2);
    particle.vx += Math.sin(time * 3.1 + particle.seed) * max * dt * 2.4;
    particle.vy += Math.cos(time * 2.6 + particle.phase) * max * dt * 2.4;
    const mag = Math.hypot(particle.vx, particle.vy) || 1;
    if (mag > max) {
      particle.vx = (particle.vx / mag) * max;
      particle.vy = (particle.vy / mag) * max;
    }
  }

  if (scene.shape === "bubbles" || scene.direction === "float") {
    particle.x += Math.sin(time * 0.8 + particle.phase) * dt * 0.045;
  }
  if (scene.shape === "embers") {
    particle.x += Math.sin(time * 2 + particle.seed) * dt * 0.03;
  }
  if (scene.shape === "hearts") {
    particle.x += Math.sin(time * 0.6 + particle.phase) * dt * 0.03;
    particle.y += Math.cos(time * 0.45 + particle.seed) * dt * 0.02;
  }

  particle.x += particle.vx * dt;
  particle.y += particle.vy * dt;
  particle.phase += dt * 0.8;

  const goal = particle.dying ? 0 : 1;
  particle.alpha += (goal - particle.alpha) * Math.min(1, dt * 3);

  if (!particle.dying) {
    const margin = 0.08;
    if (particle.x < -margin) particle.x = 1 + margin;
    if (particle.x > 1 + margin) particle.x = -margin;
    if (particle.y < -margin) particle.y = 1 + margin;
    if (particle.y > 1 + margin) particle.y = -margin;
  }
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
}

export function mixHex(from: string, to: string, t: number): string {
  const a = parseHex(from);
  const b = parseHex(to);
  return rgbCss({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  });
}

/** Caps devicePixelRatio at 2 and keeps the buffer matched to the CSS size. */
export function sizeCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): { w: number; h: number } | null {
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  if (w < 2 || h < 2) return null;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const bufferW = Math.round(w * dpr);
  const bufferH = Math.round(h * dpr);
  if (canvas.width !== bufferW || canvas.height !== bufferH) {
    canvas.width = bufferW;
    canvas.height = bufferH;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h };
}

export function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  top: string,
  bottom: string,
  glow: string,
  glowStrength: number,
): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  const vignette = ctx.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.15, w / 2, h * 0.5, Math.max(w, h) * 0.72);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  if (glowStrength > 0.01) {
    const cx = w / 2;
    const cy = h * 0.46;
    const radius = Math.min(w, h) * 0.42;
    const light = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    light.addColorStop(0, withAlpha(glow, 0.55 * glowStrength));
    light.addColorStop(0.42, withAlpha(glow, 0.14 * glowStrength));
    light.addColorStop(1, withAlpha(glow, 0));
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, w, h);
  }
}

export function drawParticle(
  ctx: CanvasRenderingContext2D,
  particle: Particle,
  scene: Scene,
  w: number,
  h: number,
  time: number,
  allowTwinkle: boolean,
  alphaScale = 1,
): void {
  const twinkle =
    allowTwinkle && (scene.shape === "stars" || scene.shape === "fireflies")
      ? 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(time * (scene.shape === "fireflies" ? 7 : 1.6) + particle.phase))
      : 1;
  const base = scene.shape === "rain" || scene.shape === "lines" ? 0.7 : 0.92;
  const alpha = particle.alpha * twinkle * base * alphaScale;
  if (alpha < 0.015) return;

  const x = particle.x * w;
  const y = particle.y * h;
  const scale = Math.max(1, Math.min(w, h) / 780);
  const s = particle.size * scale;

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.fillStyle = scene.particle;
  ctx.strokeStyle = scene.particle;
  ctx.lineCap = "round";

  switch (scene.shape) {
    case "stars":
      ctx.rotate(particle.phase * 0.2);
      traceStar(ctx, Math.max(1.2, s));
      ctx.fill();
      break;
    case "rain":
      ctx.rotate(-0.18);
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(0, -s * 7);
      ctx.lineTo(0, s * 7);
      ctx.stroke();
      break;
    case "embers": {
      const flicker = 0.75 + 0.25 * Math.sin(time * 9 + particle.seed);
      fillGlow(ctx, s * 4.2 * flicker, scene.particle);
      ctx.fillStyle = "#fff4ea";
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0.8, s * 0.45), 0, TWO_PI);
      ctx.fill();
      break;
    }
    case "bubbles":
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(4, s), 0, TWO_PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-s * 0.28, -s * 0.32, Math.max(1.2, s * 0.18), 0, TWO_PI);
      ctx.stroke();
      break;
    case "hearts":
      ctx.rotate(Math.sin(particle.phase) * 0.35);
      traceHeart(ctx, Math.max(4, s * 0.85));
      ctx.fill();
      break;
    case "lines":
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.moveTo(-s * 46, 0);
      ctx.lineTo(s * 46, 0);
      ctx.stroke();
      break;
    case "fireflies":
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-particle.vx * w * 0.07, -particle.vy * h * 0.07);
      ctx.lineTo(0, 0);
      ctx.stroke();
      fillGlow(ctx, s * 3.4, scene.particle);
      ctx.fillStyle = "#fffef2";
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0.7, s * 0.35), 0, TWO_PI);
      ctx.fill();
      break;
    default:
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1.2, s), 0, TWO_PI);
      ctx.fill();
      break;
  }
  ctx.restore();
}

function traceStar(ctx: CanvasRenderingContext2D, radius: number): void {
  const inner = radius * 0.42;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const arm = i % 2 === 0 ? radius : inner;
    const angle = -Math.PI / 2 + i * (Math.PI / 5);
    const x = Math.cos(angle) * arm;
    const y = Math.sin(angle) * arm;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function traceHeart(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.moveTo(0, s * 0.9);
  ctx.bezierCurveTo(s * 1.55, s * 0.15, s * 0.8, -s * 1.2, 0, -s * 0.28);
  ctx.bezierCurveTo(-s * 0.8, -s * 1.2, -s * 1.55, s * 0.15, 0, s * 0.9);
  ctx.closePath();
}

function fillGlow(ctx: CanvasRenderingContext2D, radius: number, color: string): void {
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  glow.addColorStop(0, withAlpha(color, 0.9));
  glow.addColorStop(0.45, withAlpha(color, 0.28));
  glow.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TWO_PI);
  ctx.fill();
}

function parseHex(hex: string): Rgb {
  const value = hex.replace("#", "");
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function rgbCss(color: Rgb): string {
  return `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;
}

function withAlpha(color: string, alpha: number): string {
  if (color.startsWith("#")) {
    const { r, g, b } = parseHex(color);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  const match = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (match) return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
  return color;
}
