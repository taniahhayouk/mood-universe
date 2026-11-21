import type { MoodEntry } from "../types";

export const ENTRIES_KEY = "mood-universe.entries";
export const SOUND_KEY = "mood-universe.sound";

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function sanitizeEntries(value: unknown): MoodEntry[] {
  if (!Array.isArray(value)) return [];
  const entries: MoodEntry[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Partial<MoodEntry>;
    if (typeof entry.id !== "string" || entry.id.length === 0) continue;
    if (typeof entry.mood !== "string" || entry.mood.length === 0) continue;
    if (typeof entry.intensity !== "number" || entry.intensity < 1 || entry.intensity > 5) continue;
    if (typeof entry.note !== "string") continue;
    if (typeof entry.timestamp !== "number" || !Number.isFinite(entry.timestamp)) continue;
    entries.push({
      id: entry.id,
      mood: entry.mood,
      intensity: Math.round(entry.intensity),
      note: entry.note.slice(0, 280),
      timestamp: entry.timestamp,
    });
  }
  return entries;
}

export function readStored<T>(key: string, initial: T, revive?: (raw: unknown) => T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return initial;
    const parsed: unknown = JSON.parse(raw);
    return revive ? revive(parsed) : (parsed as T);
  } catch {
    return initial;
  }
}

export function writeStored(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}
