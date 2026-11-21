import { useEffect, useId, useRef, useState } from "react";
import type { Mood } from "../types";
import { createId } from "../lib/storage";
import type { MoodEntry } from "../types";

interface LogPanelProps {
  mood: Mood;
  intensity: number;
  onClose: () => void;
  onSave: (entry: MoodEntry) => void;
}

export function LogPanel({ mood, intensity, onClose, onSave }: LogPanelProps) {
  const titleId = useId();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    fieldRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div
        className="dialog glass"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id={titleId}>
          <span aria-hidden="true">{mood.emoji} </span>
          Log {mood.label}
        </h2>
        <p className="hint">Intensity {intensity} of 5. A note is optional.</p>
        <label className="field" htmlFor="mood-note">
          Note
        </label>
        <textarea
          id="mood-note"
          ref={fieldRef}
          maxLength={280}
          value={note}
          placeholder="What is this feeling sitting next to?"
          onChange={(event) => setNote(event.target.value.slice(0, 280))}
        />
        <p className="counter" aria-live="polite">
          {note.length} / 280
        </p>
        <div className="actions">
          <button type="button" className="ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => {
              onSave({
                id: createId(),
                mood: mood.id,
                intensity,
                note: note.trim(),
                timestamp: Date.now(),
              });
            }}
          >
            Save entry
          </button>
        </div>
      </div>
    </div>
  );
}
