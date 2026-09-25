import React, { useState } from "react";
import { Bot, X, BookOpen, PenLine, Check } from "lucide-react";
import { getAIUserMessage } from "../ai/errors";
import useDialogA11y from "../hooks/useDialogA11y";

export default function AITutorModal({ deck, onClose, generateAITutorResponse }) {
  const [mode, setMode] = useState(null); // 'explain' | 'sentences' | 'correct'
  const [selectedCard, setSelectedCard] = useState(deck?.cards[0] || null);
  const [userInput, setUserInput] = useState("");
  const [response, setResponse] = useState("");
  const [correctionResult, setCorrectionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { dialogRef } = useDialogA11y({ onClose });

  const level = deck?.level || "A1";
  const word = selectedCard?.back || "";

  const run = async (m) => {
    if (!word && m !== "correct") return;

    setMode(m);
    setResponse("");
    setError("");
    setCorrectionResult(null);

    if (m === "correct" && !userInput.trim()) return;

    setLoading(true);
    try {
      const res = await generateAITutorResponse(m, word, userInput, level);
      if (m === "correct") {
        setCorrectionResult(res);
      } else {
        setResponse(res);
      }
    } catch(e) { setError(getAIUserMessage(e)); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="ai-tutor-dialog-title" className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h3 id="ai-tutor-dialog-title" className="flex items-center gap-2 font-extrabold text-gray-800"><Bot size={16} aria-hidden="true" /> AI Tutor</h3>
            <p className="text-xs text-gray-400 mt-0.5">AI-powered explanations</p>
          </div>
          <button type="button" aria-label="Close AI Tutor dialog" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded"><X size={18} aria-hidden="true" /></button>
        </div>

        <div className="p-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Select Word</p>
          <select
            data-dialog-initial-focus="true"
            aria-label="Tutor word"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            value={selectedCard?.id || ""}
            onChange={e => setSelectedCard(deck.cards.find(c=>c.id===e.target.value) || null)}
          >
            {deck?.cards.map(c => (
              <option key={c.id} value={c.id}>{c.back} ({c.front})</option>
            ))}
          </select>
        </div>

        <div className="p-4 flex flex-col gap-3 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 gap-2">
            {[
              {key:"explain", icon:"📖", label:"Explain"},
              {key:"sentences", icon:"✍️", label:"Sentences"},
              {key:"correct", icon:"✅", label:"Correct Me"},
            ].map(btn => (
              <button key={btn.key} onClick={() => run(btn.key)}
                type="button"
                aria-label={btn.label}
                disabled={loading}
                className={"flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-bold transition-all disabled:opacity-40 " + (mode===btn.key ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 bg-white text-gray-600 hover:border-purple-300")}>
                <span className="text-lg">{btn.icon}</span>{btn.label}
              </button>
            ))}
          </div>

          {mode === "correct" && (
            <div className="flex gap-2">
              <input
                aria-label="German sentence to correct"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="Write a German sentence to check…"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => e.key==="Enter" && run("correct")}
              />
              <button type="button" onClick={() => run("correct")} disabled={loading || !userInput.trim()}
                className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-purple-700 transition-colors">
                Check
              </button>
            </div>
          )}

          {loading && (
            <div role="status" aria-live="polite" className="flex items-center justify-center py-8 gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay:"0ms"}}/>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay:"150ms"}}/>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay:"300ms"}}/>
            </div>
          )}

          {error && <p role="alert" className="text-xs text-red-500 font-bold text-center">{error}</p>}

          {response && !loading && mode !== "correct" && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mt-2">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{response}</pre>
            </div>
          )}

          {correctionResult && !loading && mode === "correct" && (
            <div className="space-y-3 mt-2">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1">Corrected</p>
                <p className="text-sm font-medium text-emerald-900">{correctionResult.corrected}</p>
              </div>

              {correctionResult.mistakes?.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-red-800 uppercase tracking-widest mb-3">Mistakes</p>
                  <div className="flex flex-col gap-2">
                    {correctionResult.mistakes.map((m, i) => (
                      <div key={i} className="flex flex-col gap-1 text-sm bg-white p-2.5 rounded-lg border border-red-100 shadow-sm">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-semibold text-red-800 line-through decoration-red-400">{m.original}</span>
                          {m.type && <span className="text-[9px] uppercase font-bold text-red-500 bg-red-100 px-1.5 py-0.5 rounded-sm shrink-0">{m.type}</span>}
                        </div>
                        <span className="font-bold text-emerald-600">→ {m.correct}</span>
                        {m.reason && <span className="text-xs text-gray-500 mt-1 leading-snug">{m.reason}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-1">Explanation</p>
                <p className="text-sm text-blue-900 leading-relaxed">{correctionResult.explanation}</p>
              </div>

              {correctionResult.improved?.length > 0 && (
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-purple-800 uppercase tracking-widest mb-2">Improved Versions</p>
                  <div className="flex flex-col gap-1.5">
                    {Array.isArray(correctionResult.improved) ? correctionResult.improved.map((imp, i) => (
                      <div key={i} className="text-sm font-medium text-purple-900 bg-white px-3 py-2 rounded-lg border border-purple-100 shadow-sm">
                        ✨ {imp}
                      </div>
                    )) : (
                      <div className="text-sm font-medium text-purple-900 bg-white px-3 py-2 rounded-lg border border-purple-100 shadow-sm">
                        ✨ {correctionResult.improved}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
