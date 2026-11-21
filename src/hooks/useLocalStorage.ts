import { useCallback, useState } from "react";
import type { SetStateAction } from "react";
import { readStored, writeStored } from "../lib/storage";

export function useLocalStorage<T>(
  key: string,
  initial: T,
  revive?: (raw: unknown) => T,
): readonly [T, (value: SetStateAction<T>) => void] {
  const [state, setState] = useState<T>(() => readStored(key, initial, revive));

  const setValue = useCallback(
    (value: SetStateAction<T>) => {
      setState((prev) => {
        const next = typeof value === "function" ? (value as (current: T) => T)(prev) : value;
        try {
          writeStored(key, next);
        } catch {
          // Storage can be unavailable. Keep the in-memory value.
        }
        return next;
      });
    },
    [key],
  );

  return [state, setValue];
}
