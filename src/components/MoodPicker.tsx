import type { CSSProperties } from "react";
import { MOODS } from "../data/moods";

export function MoodPicker() {
  return (
    <section className="page">
      <div className="hero glass">
        <p className="kicker">A sky for every feeling</p>
        <h1>Mood Universe</h1>
        <p className="lead">Pick how you feel. The whole page becomes that universe, and you can keep the moment.</p>
      </div>
      <div className="mood-grid">
        {MOODS.map((mood) => (
          <button
            key={mood.id}
            type="button"
            className="mood-card glass"
            style={{ "--card": mood.palette.accent } as CSSProperties}
            onClick={() => {
              window.location.hash = `/universe/${mood.id}`;
            }}
          >
            <span className="emoji" aria-hidden="true">
              {mood.emoji}
            </span>
            <span className="mood-label">{mood.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
