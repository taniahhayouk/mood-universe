import { useState } from "react";
import type { Mood } from "../types";

function pickLine(lines: readonly string[], current?: string): string {
  if (lines.length === 0) return "";
  if (lines.length === 1) return lines[0] ?? "";
  let next = lines[Math.floor(Math.random() * lines.length)] ?? "";
  let guard = 0;
  while (next === current && guard < 6) {
    next = lines[Math.floor(Math.random() * lines.length)] ?? next;
    guard += 1;
  }
  return next;
}

interface UniverseViewProps {
  mood: Mood;
  intensity: number;
  onIntensity: (value: number) => void;
  onLog: () => void;
}

export function UniverseView({ mood, intensity, onIntensity, onLog }: UniverseViewProps) {
  const [line, setLine] = useState(() => pickLine(mood.affirmations));

  return (
    <section className="page universe">
      <article className="universe-card glass">
        <p className="kicker">
          <span aria-hidden="true">{mood.emoji} </span>
          {mood.label} universe
        </p>
        <h1>{mood.label}</h1>
        <p className="lead">{mood.description}</p>
        <blockquote className="affirmation" aria-live="polite">
          {line}
        </blockquote>
        <div className="actions">
          <button type="button" className="ghost" onClick={() => setLine(pickLine(mood.affirmations, line))}>
            New one
          </button>
          <button type="button" className="primary" onClick={onLog}>
            Log this mood
          </button>
        </div>
        <div className="slider">
          <div className="slider-row">
            <label htmlFor="intensity">Intensity</label>
            <span id="intensity-value">{intensity} / 5</span>
          </div>
          <input
            id="intensity"
            type="range"
            min={1}
            max={5}
            step={1}
            value={intensity}
            aria-valuemin={1}
            aria-valuemax={5}
            aria-valuenow={intensity}
            aria-valuetext={`Intensity ${intensity} of 5`}
            aria-describedby="intensity-hint"
            onChange={(event) => onIntensity(Number(event.target.value))}
          />
          <p id="intensity-hint" className="hint">
            Higher intensity adds more motion.
          </p>
        </div>
        <a className="text-link" href="#/">
          All moods
        </a>
      </article>
    </section>
  );
}
