export type ParticleShape =
  | "circles"
  | "stars"
  | "rain"
  | "embers"
  | "bubbles"
  | "hearts"
  | "lines"
  | "fireflies";

export type ParticleDirection = "up" | "down" | "drift" | "float" | "wander" | "across";

export interface ParticleConfig {
  count: number;
  speed: number;
  size: number;
  direction: ParticleDirection;
  shape: ParticleShape;
}

export interface MoodPalette {
  bgTop: string;
  bgBottom: string;
  accent: string;
  text: string;
  particle: string;
  /** Soft rgba glow used on glass panels. */
  glow: string;
}

export interface Mood {
  id: string;
  label: string;
  emoji: string;
  palette: MoodPalette;
  particles: ParticleConfig;
  affirmations: readonly string[];
  description: string;
  /** Web Audio oscillator frequency in hertz. */
  tone: number;
}

export interface MoodEntry {
  id: string;
  mood: string;
  intensity: number;
  note: string;
  timestamp: number;
}

export type AppPage = "home" | "universe" | "journal" | "galaxy";
