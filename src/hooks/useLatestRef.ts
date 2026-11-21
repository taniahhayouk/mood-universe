import { useEffect, useRef } from "react";
import type { RefObject } from "react";

/**
 * Keeps a ref pointed at the newest value without writing during render,
 * so animation loops and event handlers can read it without re-subscribing.
 */
export function useLatestRef<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
