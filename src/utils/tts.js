/**
 * German TTS — production-safe, proxy-free
 *
 * Strategy:
 *  - Use the Web Speech API (SpeechSynthesis) for ALL speeds.
 *  - Works on localhost AND Firebase Hosting without any server proxy.
 *
 * Chrome on macOS/Windows has two known bugs:
 *  1. speechSynthesis.speaking stays true but emits no audio → fix: pause/resume pulse every 200ms
 *  2. Voices list is empty until "voiceschanged" fires → fix: lazy warm-up
 *  3. Tab blur suspends synthesis → fix: resume() on visibilitychange
 *  4. AudioContext suspended until user gesture → fix: unlock on first call
 */

let _deVoice = null;
let _warmDone = false;
let _pulseInterval = null;
let _audioCtxUnlocked = false;

/** Pick the best German voice available */
function warm() {
  if (_warmDone) return;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;

  // Priority order: Google Deutsch > any "German" named voice > de-DE > de
  _deVoice =
    voices.find(v => v.name === "Google Deutsch") ||
    voices.find(v => /german/i.test(v.name)) ||
    voices.find(v => v.lang?.startsWith("de-DE")) ||
    voices.find(v => v.lang?.startsWith("de")) ||
    null;

  _warmDone = true;
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.addEventListener("voiceschanged", warm);
  warm(); // attempt immediate warm-up (Firefox/Safari resolve instantly)

  // Resume synthesis whenever the tab becomes visible again
  // (Chrome suspends it on tab/window blur)
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      window.speechSynthesis.resume();
    }
  });
}

/** Keep the Chrome audio engine alive during long utterances */
function stopPulse() {
  if (_pulseInterval) {
    clearInterval(_pulseInterval);
    _pulseInterval = null;
  }
}

function startPulse(synth) {
  stopPulse();
  _pulseInterval = setInterval(() => {
    if (!synth.speaking) { stopPulse(); return; }
    synth.pause();
    synth.resume();
  }, 200); // 200ms is more reliable than 800ms for Chrome desktop
}

/**
 * Silently unlock the AudioContext on first user interaction.
 * Chrome requires a user-gesture before any audio can play.
 * Calling this from within a click handler satisfies that requirement.
 */
function unlockAudioContext() {
  if (_audioCtxUnlocked) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    ctx.resume().then(() => { _audioCtxUnlocked = true; });
  } catch (_) {
    // ignore — not all browsers support AudioContext
    _audioCtxUnlocked = true;
  }
}

/**
 * Speak German text aloud.
 * @param {string} text   - German text to pronounce
 * @param {"slow"|"normal"} speed - playback rate
 */
export function speakGerman(text, speed = "normal") {
  if (!text) return;

  const synth = window.speechSynthesis;
  if (!synth) return;

  // Unlock AudioContext on first call (must be inside a user-gesture stack)
  unlockAudioContext();

  // Lazy voice warm-up in case voices weren't ready at module load time
  if (!_warmDone) warm();

  const rate = speed === "slow" ? 0.65 : 1.0;

  const u = new SpeechSynthesisUtterance(text);
  u.lang   = "de-DE";
  u.rate   = rate;
  u.pitch  = 1;
  u.volume = 1;
  if (_deVoice) u.voice = _deVoice;

  u.onstart = () => startPulse(synth);
  u.onend   = () => stopPulse();
  u.onerror = (e) => {
    stopPulse();
    console.warn("[TTS] SpeechSynthesis error:", e.error);
  };

  // Cancel any in-progress speech before starting a new one
  synth.cancel();
  // Small delay after cancel() is required on some Chrome versions
  setTimeout(() => synth.speak(u), 50);
}
