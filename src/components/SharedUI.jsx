import React, { useState, useEffect, useRef } from "react";
import { GS } from "../config/constants";

// Re-arm synthesis when tab regains focus (Chrome suspends it on blur)
if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const isLocalhost = () =>
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

const isMobileBrowser = () =>
  /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

/** Speak German text via Web Speech API.
 *  Must be called synchronously from a user-gesture handler (click)
 *  because Chrome 71+ enforces a user-activation requirement.
 */
function speakWebSpeech(text, rate, onEnd, pulseRef) {
  const synth = window.speechSynthesis;
  if (!synth) { onEnd(); return; }

  // Fresh voice lookup every call (no stale cache from HMR)
  const voices = synth.getVoices();
  const voice  =
    voices.find(v => v.name === "Google Deutsch") ||
    voices.find(v => /german/i.test(v.name))     ||
    voices.find(v => v.lang?.startsWith("de-DE")) ||
    voices.find(v => v.lang?.startsWith("de"))    ||
    null;

  const u = new SpeechSynthesisUtterance(text);
  u.lang   = "de-DE";
  u.rate   = rate;
  u.pitch  = 1;
  u.volume = 1;
  if (voice) u.voice = voice;

  // Chrome desktop stall fix: pulse pause→resume to keep audio engine alive.
  // NOT used on mobile — mobile TTS works fine and the pulse causes choppy cuts.
  const mobile = isMobileBrowser();
  u.onstart = () => {
    if (mobile) return;
    pulseRef.current = setInterval(() => {
      if (!synth.speaking) { clearInterval(pulseRef.current); return; }
      synth.pause();
      synth.resume();
    }, 5000); // 5s — just enough to prevent the ~15s stall, doesn't cause cuts
  };

  u.onend = () => {
    clearInterval(pulseRef.current);
    onEnd();
  };
  u.onerror = (ev) => {
    clearInterval(pulseRef.current);
    if (ev.error !== "canceled" && ev.error !== "interrupted") {
      console.warn("[TTS] Web Speech error:", ev.error);
    }
    onEnd();
  };

  // Original working sequence: cancel → resume → speak
  synth.cancel();
  synth.resume();
  synth.speak(u);
}

// ── SpeakBtn ──────────────────────────────────────────────────────────────────
export function SpeakBtn({ text, small }) {
  const [active, setActive] = useState(null);
  const safetyTimer = useRef(null);
  const pulseTimer  = useRef(null);
  const audioRef    = useRef(null);

  useEffect(() => () => {
    clearTimeout(safetyTimer.current);
    clearInterval(pulseTimer.current);
    if (audioRef.current) audioRef.current.pause();
  }, []);

  const play = (e, speed) => {
    e.stopPropagation();
    if (!text) return;

    // ── Reset all previous state ──────────────────────────────────────────────
    clearTimeout(safetyTimer.current);
    clearInterval(pulseTimer.current);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    window.speechSynthesis?.cancel();

    setActive(speed);
    const rate    = speed === "slow" ? 0.65 : 1.0;
    const onEnd   = () => {
      clearTimeout(safetyTimer.current);
      clearInterval(pulseTimer.current);
      setActive(null);
    };
    safetyTimer.current = setTimeout(onEnd, 9000);

    if (isLocalhost()) {
      // ── LOCALHOST: use Vite proxy → Google TTS (high quality, fast) ──────────
      // The proxy rewrites /tts-proxy → translate.google.com/translate_tts
      const audio = new Audio(
        "/tts-proxy?ie=UTF-8&q=" + encodeURIComponent(text) + "&tl=de&client=tw-ob"
      );
      audio.playbackRate = rate;
      audioRef.current   = audio;
      audio.onended      = onEnd;
      // If proxy fails for any reason, fall back to Web Speech API
      audio.onerror      = () => speakWebSpeech(text, rate, onEnd, pulseTimer);
      audio.play().catch(() => speakWebSpeech(text, rate, onEnd, pulseTimer));
    } else {
      // ── PRODUCTION: call Web Speech API directly in the user-gesture stack ───
      // This is CRITICAL — Chrome 71+ requires speechSynthesis.speak() to be
      // called synchronously within ~100ms of a user gesture (click).
      // Calling it from an async audio.onerror callback violates this and
      // causes silent failure with no error logged.
      speakWebSpeech(text, rate, onEnd, pulseTimer);
    }
  };

  const Btn = ({ speed, icon, label }) => (
    <button
      onClick={e => play(e, speed)}
      className={
        "inline-flex items-center gap-0.5 rounded-lg border font-semibold transition-all " +
        (active === speed
          ? "bg-blue-100 border-blue-400 text-blue-600"
          : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-blue-50 hover:border-blue-300") +
        " " + (small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs")
      }
    >
      {icon}{label}
    </button>
  );

  return (
    <span className="inline-flex gap-1" onClick={e => e.stopPropagation()}>
      <Btn speed="slow"   icon="🐢" label="Slow"   />
      <Btn speed="normal" icon="🔈" label="Normal" />
    </span>
  );
}

// ── GBadge ────────────────────────────────────────────────────────────────────
export function GBadge({ g, size = "sm" }) {
  const s = GS[g] || GS.das;
  return (
    <span
      className={
        "inline-block px-2 py-0.5 rounded-full font-bold " +
        (size === "lg" ? "text-sm" : "text-xs") +
        " " + s.badge
      }
    >
      {s.label}
    </span>
  );
}
