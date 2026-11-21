import { useEffect, useMemo, useState } from "react";
import type { MoodEntry } from "../types";
import { MOODS, getMood } from "../data/moods";

interface JournalListProps {
  entries: readonly MoodEntry[];
  onDelete: (id: string) => void;
  onClear: () => void;
}

function formatWhen(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

export function JournalList({ entries, onDelete, onClear }: JournalListProps) {
  const [filter, setFilter] = useState("all");
  const [confirming, setConfirming] = useState(false);
  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.timestamp - a.timestamp),
    [entries],
  );
  const shown = filter === "all" ? sorted : sorted.filter((entry) => entry.mood === filter);

  useEffect(() => {
    if (!confirming) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConfirming(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirming]);

  return (
    <section className="page journal">
      <header className="journal-head">
        <div>
          <h1>Journal</h1>
          <p className="lead">Newest first. Everything stays in this browser.</p>
        </div>
        <button
          type="button"
          className="ghost"
          disabled={entries.length === 0}
          onClick={() => setConfirming(true)}
        >
          Clear all
        </button>
      </header>

      <div className="filters" role="group" aria-label="Filter by mood">
        <button
          type="button"
          className="chip"
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        {MOODS.map((mood) => {
          const count = entries.filter((entry) => entry.mood === mood.id).length;
          return (
            <button
              key={mood.id}
              type="button"
              className="chip"
              aria-pressed={filter === mood.id}
              onClick={() => setFilter(mood.id)}
            >
              <span aria-hidden="true">{mood.emoji}</span>
              {mood.label}
              <span className="chip-count">{count}</span>
            </button>
          );
        })}
      </div>

      {entries.length === 0 ? (
        <div className="empty glass">
          <p>Your journal is empty.</p>
          <p>Log a mood from any universe and it will wait here.</p>
          <a className="primary" href="#/">
            Pick a mood
          </a>
        </div>
      ) : shown.length === 0 ? (
        <p className="empty-inline">Nothing logged for this mood yet.</p>
      ) : (
        <ul className="entry-list">
          {shown.map((entry) => {
            const mood = getMood(entry.mood);
            const label = mood?.label ?? entry.mood;
            const when = formatWhen(entry.timestamp);
            return (
              <li key={entry.id} className="entry glass">
                <div className="entry-top">
                  <p className="entry-title">
                    <span aria-hidden="true">{mood?.emoji ?? "✨"}</span>
                    {label}
                  </p>
                  <button
                    type="button"
                    className="text-button"
                    aria-label={`Delete ${label} entry from ${when}`}
                    onClick={() => onDelete(entry.id)}
                  >
                    Delete
                  </button>
                </div>
                <p className="meta">
                  Intensity {entry.intensity} of 5
                  <span aria-hidden="true"> · </span>
                  <time dateTime={new Date(entry.timestamp).toISOString()}>{when}</time>
                </p>
                {entry.note ? <p className="note">{entry.note}</p> : <p className="hint">No note</p>}
              </li>
            );
          })}
        </ul>
      )}

      {confirming && (
        <div className="overlay" onMouseDown={() => setConfirming(false)}>
          <div
            className="dialog glass"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="clear-title">Clear every entry?</h2>
            <p>This removes your journal and the lights in your galaxy. It cannot be undone.</p>
            <div className="actions">
              <button type="button" className="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => {
                  onClear();
                  setConfirming(false);
                }}
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
