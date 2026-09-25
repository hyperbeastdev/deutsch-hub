/**
 * answerFeedback — lightweight answer sound feedback utility
 *
 * Uses Web Audio API to synthesise two short tones:
 *   correct  → soft two-note ascending cue (E5 → G5, ~100ms each)
 *   incorrect → muted low single note (B3, ~180ms)
 *
 * Design goals:
 *  - No external assets, no CDN, works fully offline / PWA
 *  - Sub-millisecond latency (no file decode step)
 *  - Gracefully handles suspended AudioContext (browser blocks until gesture)
 *  - User-controllable ON/OFF setting persisted in localStorage
 *  - Never throws to callers; all errors silently swallowed
 *
 * Usage:
 *   answerFeedback.correct()
 *   answerFeedback.incorrect()
 *   answerFeedback.setEnabled(bool)
 *   answerFeedback.isEnabled()
 */

const STORAGE_KEY = "dh_sound_feedback";

let _ctx = null;

function getCtx() {
  if (_ctx) return _ctx;
  try {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (_) {
    _ctx = null;
  }
  return _ctx;
}

async function ensureRunning(ctx) {
  if (ctx.state === "suspended") {
    try { await ctx.resume(); } catch (_) { /* ignore */ }
  }
}

/**
 * Play a single short sine/triangle tone.
 */
function tone(ctx, freq, startTime, duration, gain = 0.18, type = "sine") {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  // Smooth attack/release to avoid clicks
  env.gain.setValueAtTime(0, startTime);
  env.gain.linearRampToValueAtTime(gain, startTime + 0.010);
  env.gain.setValueAtTime(gain, startTime + duration - 0.025);
  env.gain.linearRampToValueAtTime(0, startTime + duration);

  osc.connect(env);
  env.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.005);
}

const answerFeedback = {
  isEnabled() {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Default OFF — conservative; user opts in
    return stored === null ? false : stored === "1";
  },

  setEnabled(enabled) {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  },

  async correct() {
    if (!this.isEnabled()) return;
    const ctx = getCtx();
    if (!ctx) return;
    try {
      await ensureRunning(ctx);
      const t = ctx.currentTime + 0.001;
      // Bright ascending two-note: E5 (659Hz) → G5 (784Hz)
      tone(ctx, 659, t,        0.10, 0.16, "sine");
      tone(ctx, 784, t + 0.10, 0.10, 0.14, "sine");
    } catch (_) { /* graceful failure */ }
  },

  async incorrect() {
    if (!this.isEnabled()) return;
    const ctx = getCtx();
    if (!ctx) return;
    try {
      await ensureRunning(ctx);
      const t = ctx.currentTime + 0.001;
      // Soft muted low note: B3 (247Hz), quieter, triangle wave
      tone(ctx, 247, t, 0.18, 0.10, "triangle");
    } catch (_) { /* graceful failure */ }
  },

  async flip() {
    if (!this.isEnabled()) return;
    const ctx = getCtx();
    if (!ctx) return;
    try {
      await ensureRunning(ctx);
      const t = ctx.currentTime + 0.001;
      const duration = 0.055; // 55ms — crisp card turn

      // White noise source
      const bufferSize = Math.ceil(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Bandpass filter — centre ~2.2kHz gives paper-rustle character
      const bpf = ctx.createBiquadFilter();
      bpf.type = "bandpass";
      bpf.frequency.value = 2200;
      bpf.Q.value = 1.8;

      // Gain envelope: instant attack, fast exponential decay
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.13, t);
      env.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      source.connect(bpf);
      bpf.connect(env);
      env.connect(ctx.destination);

      source.start(t);
      source.stop(t + duration + 0.005);
    } catch (_) { /* graceful failure */ }
  },
};

export default answerFeedback;
