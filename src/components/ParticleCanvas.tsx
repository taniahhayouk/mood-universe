import { useEffect, useRef } from "react";
import type { Scene } from "../lib/particles";
import {
  drawBackdrop,
  drawParticle,
  easeInOut,
  mixHex,
  sizeCanvas,
  stepParticle,
  syncPopulation,
  createParticle,
} from "../lib/particles";
import type { Particle } from "../lib/particles";
import { useAnimationFrame } from "../hooks/useAnimationFrame";
import { useLatestRef } from "../hooks/useLatestRef";

interface ParticleCanvasProps {
  scene: Scene;
  reducedMotion: boolean;
}

interface FadeLayer {
  particles: Particle[];
  scene: Scene;
  age: number;
  duration: number;
}

export function ParticleCanvas({ scene, reducedMotion }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useLatestRef(scene);
  const reducedRef = useLatestRef(reducedMotion);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const shownId = useRef("");
  const shownScene = useRef<Scene | null>(null);
  const liveRef = useRef<Particle[]>([]);
  const fadeRef = useRef<FadeLayer | null>(null);
  const prevSpeed = useRef(0);

  useAnimationFrame((dt, time) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = ctxRef.current ?? canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    ctxRef.current = ctx;
    const size = sizeCanvas(canvas, ctx);
    if (!size) return;

    const target = sceneRef.current;
    const reduced = reducedRef.current;
    let current = target;

    // Swap particle sets and cross-fade for about 800ms when the mood changes.
    if (shownId.current !== target.id) {
      const duration = reduced ? 0 : 0.8;
      if (shownId.current && shownScene.current && duration > 0) {
        fadeRef.current = {
          particles: liveRef.current,
          scene: shownScene.current,
          age: 0,
          duration,
        };
      }
      shownId.current = target.id;
      shownScene.current = target;
      prevSpeed.current = target.speed;
      liveRef.current = Array.from({ length: target.count }, () => createParticle(target, !reduced));
      current = target;
    } else {
      if (prevSpeed.current > 0 && prevSpeed.current !== target.speed) {
        const ratio = target.speed / prevSpeed.current;
        for (const particle of liveRef.current) {
          particle.vx *= ratio;
          particle.vy *= ratio;
        }
        prevSpeed.current = target.speed;
      }
      shownScene.current = target;
      current = target;
      syncPopulation(liveRef.current, target.count, target, !reduced);
    }

    const fade = fadeRef.current;
    for (const particle of liveRef.current) stepParticle(particle, current, dt, time);
    if (fade) {
      for (const particle of fade.particles) stepParticle(particle, fade.scene, dt, time);
      fade.age += dt;
    }

    const t = fade ? easeInOut(Math.min(1, fade.age / fade.duration)) : 1;
    const from = fade?.scene ?? current;
    const glowStrength = (fade && from.centerGlow ? 1 - t : 0) + (current.centerGlow ? t : 0);
    drawBackdrop(
      ctx,
      size.w,
      size.h,
      mixHex(from.bgTop, current.bgTop, t),
      mixHex(from.bgBottom, current.bgBottom, t),
      current.centerGlow ? current.glow : from.glow,
      glowStrength,
    );

    if (fade) {
      for (const particle of fade.particles) {
        drawParticle(ctx, particle, fade.scene, size.w, size.h, time, !reduced, 1 - t);
      }
    }
    for (const particle of liveRef.current) {
      drawParticle(ctx, particle, current, size.w, size.h, time, !reduced);
    }

    if (fade && fade.age >= fade.duration) fadeRef.current = null;
  });

  useEffect(() => {
    const onResize = () => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (canvas && ctx) sizeCanvas(canvas, ctx);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return <canvas ref={canvasRef} className="bg-canvas" aria-hidden="true" />;
}
