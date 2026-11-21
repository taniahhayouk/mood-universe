import type { MoodEntry } from "../types";
import { getMood } from "../data/moods";
import { currentStreak, mostFrequentMood } from "../lib/stats";

export function StatsStrip({ entries }: { entries: readonly MoodEntry[] }) {
  const topId = mostFrequentMood(entries);
  const top = topId ? getMood(topId) : undefined;
  const streak = currentStreak(entries);

  return (
    <section className="stats" aria-label="Journal summary">
      <article className="stat glass">
        <p className="stat-value">{entries.length}</p>
        <p className="stat-label">Entries</p>
      </article>
      <article className="stat glass">
        <p className="stat-value">{top ? `${top.emoji} ${top.label}` : "—"}</p>
        <p className="stat-label">Most frequent</p>
      </article>
      <article className="stat glass">
        <p className="stat-value">{streak}</p>
        <p className="stat-label">Day streak</p>
      </article>
    </section>
  );
}
