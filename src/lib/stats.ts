import type { MoodEntry } from "../types";

export function calendarDay(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Consecutive local days with at least one entry.
 * Counts through today, or through yesterday if today is still empty.
 */
export function currentStreak(entries: readonly MoodEntry[]): number {
  if (entries.length === 0) return 0;
  const days = new Set(entries.map((entry) => calendarDay(entry.timestamp)));
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(calendarDay(cursor.getTime()))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(calendarDay(cursor.getTime()))) return 0;
  }
  let streak = 0;
  while (days.has(calendarDay(cursor.getTime()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Highest count. Ties go to the mood logged most recently. */
export function mostFrequentMood(entries: readonly MoodEntry[]): string | null {
  if (entries.length === 0) return null;
  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.mood, (counts.get(entry.mood) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = -1;
  let bestTime = -1;
  for (const entry of entries) {
    const count = counts.get(entry.mood) ?? 0;
    if (count > bestCount || (count === bestCount && entry.timestamp > bestTime)) {
      best = entry.mood;
      bestCount = count;
      bestTime = entry.timestamp;
    }
  }
  return best;
}
