/**
 * A single quiet oscillator. Browsers block audio until a user gesture,
 * so the click that enables sound starts the context directly.
 */

interface Graph {
  osc: OscillatorNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
}

let audio: AudioContext | null = null;
let graph: Graph | null = null;
let stopTimer = 0;
let desired = { enabled: false, frequency: 196 };

function pulseRate(frequency: number): number {
  if (frequency >= 450) return 0.35;
  if (frequency >= 280 && frequency <= 320) return 4.2;
  if (frequency <= 120) return 0.11;
  return 0.07;
}

function context(): AudioContext {
  if (!audio) audio = new AudioContext();
  return audio;
}

function ensureGraph(ctx: AudioContext): Graph {
  if (graph) return graph;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = desired.frequency;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 880;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = pulseRate(desired.frequency);
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.005;
  lfo.connect(lfoGain);
  lfoGain.connect(gain.gain);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  lfo.start();
  graph = { osc, filter, gain, lfo, lfoGain };
  return graph;
}

function retune(frequency: number): void {
  const ctx = context();
  void ctx.resume();
  const nodes = ensureGraph(ctx);
  const now = ctx.currentTime;
  nodes.osc.frequency.cancelScheduledValues(now);
  nodes.osc.frequency.setValueAtTime(nodes.osc.frequency.value, now);
  nodes.osc.frequency.linearRampToValueAtTime(frequency, now + 0.55);
  nodes.lfo.frequency.cancelScheduledValues(now);
  nodes.lfo.frequency.linearRampToValueAtTime(pulseRate(frequency), now + 0.4);
  nodes.gain.gain.cancelScheduledValues(now);
  nodes.gain.gain.setValueAtTime(Math.max(nodes.gain.gain.value, 0.0001), now);
  nodes.gain.gain.linearRampToValueAtTime(0.02, now + 0.35);
}

function silence(): void {
  if (!audio || !graph) return;
  const nodes = graph;
  const ctx = audio;
  const now = ctx.currentTime;
  nodes.gain.gain.cancelScheduledValues(now);
  nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, now);
  nodes.gain.gain.linearRampToValueAtTime(0, now + 0.2);
  window.clearTimeout(stopTimer);
  stopTimer = window.setTimeout(() => {
    if (desired.enabled || graph !== nodes) return;
    try {
      nodes.osc.stop();
      nodes.lfo.stop();
    } catch {
      // Already stopped.
    }
    nodes.osc.disconnect();
    nodes.filter.disconnect();
    nodes.gain.disconnect();
    nodes.lfo.disconnect();
    nodes.lfoGain.disconnect();
    graph = null;
  }, 260);
}

export function bindAmbient(enabled: boolean, frequency: number): void {
  desired = { enabled, frequency };
  if (!enabled) {
    silence();
    return;
  }
  if (audio && audio.state === "running") retune(frequency);
}

/** Call from a click or key handler so AudioContext is allowed to start. */
export function ambientFromGesture(): void {
  if (!desired.enabled) return;
  retune(desired.frequency);
}
