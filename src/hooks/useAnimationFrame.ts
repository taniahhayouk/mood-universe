import { useEffect } from "react";
import { useLatestRef } from "./useLatestRef";

/** One rAF loop. It stops while the tab is hidden and caps large gaps. */
export function useAnimationFrame(callback: (dt: number, time: number) => void, enabled = true): void {
  const callbackRef = useLatestRef(callback);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    let last = performance.now();
    let running = !document.hidden;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      callbackRef.current(dt, now / 1000);
      frame = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
        return;
      }
      if (!running) {
        running = true;
        last = performance.now();
        frame = requestAnimationFrame(loop);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    if (running) frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, callbackRef]);
}
