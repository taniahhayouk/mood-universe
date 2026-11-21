import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { AppPage, MoodEntry } from "./types";
import { MOODS, NEUTRAL_PALETTE, getMood } from "./data/moods";
import { buildScene } from "./lib/particles";
import { ENTRIES_KEY, SOUND_KEY, sanitizeEntries } from "./lib/storage";
import { ambientFromGesture, bindAmbient } from "./lib/sound";
import { useLatestRef } from "./hooks/useLatestRef";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { GalaxyCanvas } from "./components/GalaxyCanvas";
import { JournalList } from "./components/JournalList";
import { LogPanel } from "./components/LogPanel";
import { MoodPicker } from "./components/MoodPicker";
import { NavBar } from "./components/NavBar";
import { ParticleCanvas } from "./components/ParticleCanvas";
import { StatsStrip } from "./components/StatsStrip";
import { UniverseView } from "./components/UniverseView";

interface Route {
  page: AppPage;
  moodId?: string;
}

function readRoute(): Route {
  const parts = (window.location.hash.replace(/^#/, "") || "/").split("/").filter(Boolean);
  if (parts[0] === "journal") return { page: "journal" };
  if (parts[0] === "galaxy") return { page: "galaxy" };
  if (parts[0] === "universe" && parts[1]) return { page: "universe", moodId: parts[1] };
  return { page: "home" };
}

function useRoute(): Route {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export default function App() {
  const route = useRoute();
  const reduced = usePrefersReducedMotion();
  const [entries, setEntries] = useLocalStorage<MoodEntry[]>(ENTRIES_KEY, [], sanitizeEntries);
  const [soundOn, setSoundOn] = useLocalStorage<boolean>(SOUND_KEY, false, (value) => value === true);
  const [intensity, setIntensity] = useState(3);
  const [logKey, setLogKey] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const mood = route.page === "universe" && route.moodId ? getMood(route.moodId) : undefined;
  const page: AppPage = route.page === "universe" && !mood ? "home" : route.page;
  const palette = page === "universe" && mood ? mood.palette : NEUTRAL_PALETTE;
  const frequency = page === "universe" && mood ? mood.tone : 196;
  const frequencyRef = useLatestRef(frequency);

  // Tying the panel to the current route closes it on any navigation.
  const routeKey = `${page}:${mood?.id ?? ""}`;
  const logOpen = logKey === routeKey;

  const scene = useMemo(
    () => buildScene(page === "universe" ? (mood ?? null) : null, page === "universe" ? intensity : 2, reduced),
    [page, mood, intensity, reduced],
  );

  const closeLog = useCallback(() => setLogKey(null), []);

  useEffect(() => {
    bindAmbient(soundOn, frequency);
  }, [soundOn, frequency]);

  useEffect(() => {
    const onPointer = () => ambientFromGesture();
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, []);

  useEffect(() => {
    const titles: Record<AppPage, string> = {
      home: "Mood Universe",
      universe: mood ? `${mood.label} · Mood Universe` : "Mood Universe",
      journal: "Journal · Mood Universe",
      galaxy: "Galaxy · Mood Universe",
    };
    document.title = titles[page];
  }, [page, mood]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const theme = {
    "--accent": palette.accent,
    "--text": palette.text,
    "--glow": palette.glow,
  } as CSSProperties;

  const usedMoods = MOODS.filter((item) => entries.some((entry) => entry.mood === item.id));

  return (
    <div className="app" style={theme}>
      {page === "galaxy" ? (
        <GalaxyCanvas entries={entries} reducedMotion={reduced} />
      ) : (
        <ParticleCanvas scene={scene} reducedMotion={reduced} />
      )}
      <div className="shell">
        <NavBar
          page={page === "universe" ? "home" : page}
          soundOn={soundOn}
          onToggleSound={() => {
            const next = !soundOn;
            setSoundOn(next);
            bindAmbient(next, frequencyRef.current);
            if (next) ambientFromGesture();
          }}
        />
        <main>
          {page === "home" && <MoodPicker />}
          {page === "universe" && mood && (
            <UniverseView
              key={mood.id}
              mood={mood}
              intensity={intensity}
              onIntensity={setIntensity}
              onLog={() => setLogKey(routeKey)}
            />
          )}
          {page === "journal" && (
            <>
              <StatsStrip entries={entries} />
              <JournalList
                entries={entries}
                onDelete={(id) => setEntries((current) => current.filter((entry) => entry.id !== id))}
                onClear={() => setEntries([])}
              />
            </>
          )}
          {page === "galaxy" && (
            <section className="page galaxy-copy">
              <h1>Mood Galaxy</h1>
              <p className="lead">Each light is a feeling you kept. Same entry, same place in the sky.</p>
              {entries.length === 0 ? (
                <div className="empty glass">
                  <p>Your galaxy is still dark.</p>
                  <p>Log a mood and a light will stay here.</p>
                  <a className="primary" href="#/">
                    Pick a mood
                  </a>
                </div>
              ) : (
                <>
                  <p className="hint">Hover or tap a light to read it.</p>
                  <ul className="legend">
                    {usedMoods.map((item) => (
                      <li key={item.id}>
                        <span className="swatch" style={{ background: item.palette.particle }} />
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}
        </main>
      </div>
      {page === "universe" && mood && logOpen && (
        <LogPanel
          mood={mood}
          intensity={intensity}
          onClose={closeLog}
          onSave={(entry) => {
            setEntries((current) => [entry, ...current]);
            setLogKey(null);
            setToast("Saved to your journal");
          }}
        />
      )}
      {toast && (
        <p className="toast" role="status">
          {toast}
        </p>
      )}
    </div>
  );
}
