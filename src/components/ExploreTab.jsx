import React, { useState, useEffect } from "react";
import { LEVELS } from "../config/constants";
import { DB } from "../App";

const LEVEL_OPTIONS = ["All", "A1", "A2", "B1", "B2", "C1", "C2"];

export default function ExploreTab({ library, setLibrary, user }) {
  const [decks, setDecks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [levelFilter, setLevel]   = useState("All");
  const [importing, setImporting] = useState(null); // docId being imported
  const [messages, setMessages]   = useState({});   // docId → status msg

  useEffect(() => {
    DB.getPublicDecks().then(d => { setDecks(d); setLoading(false); });
  }, []);

  const setMsg = (docId, msg) =>
    setMessages(prev => ({ ...prev, [docId]: msg }));

  // Heuristic: deck is already in library if name + card count match
  const alreadyImported = (pd) =>
    library.some(d => d.name === pd.name && d.cards.length === pd.cards.length);

  const handleImport = async (pd) => {
    if (!user) { setMsg(pd.docId, "⚠️ Login required"); return; }
    if (alreadyImported(pd)) { setMsg(pd.docId, "✅ Already in library"); return; }
    setImporting(pd.docId);
    setMsg(pd.docId, "");

    const result = await DB.importPublicDeck(pd);

    if (result.success) {
      const newLibrary = [...library, result.deck];
      setLibrary(newLibrary);
      // Sync to Firestore (best-effort)
      try { await DB.syncLibrary(user.uid, newLibrary); } catch (_) {}
      // Optimistic counter
      setDecks(prev => prev.map(d =>
        d.docId === pd.docId ? { ...d, imports: (d.imports || 0) + 1 } : d
      ));
      setMsg(pd.docId, "✅ Added to Library!");
    } else {
      const errMap = { import_failed: "❌ Import failed. Try again." };
      setMsg(pd.docId, errMap[result.error] || "❌ Something went wrong.");
    }
    setImporting(null);
  };

  const filtered = decks.filter(d => {
    const matchSearch = d.name?.toLowerCase().includes(search.toLowerCase());
    const matchLevel  = levelFilter === "All" || d.level === levelFilter;
    return matchSearch && matchLevel;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="font-extrabold text-gray-800 text-lg">🌍 Explore Decks</h2>
        <p className="text-xs text-gray-400 mt-0.5">Community-published German flashcard decks</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <input
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="Search decks…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          value={levelFilter}
          onChange={e => setLevel(e.target.value)}
        >
          {LEVEL_OPTIONS.map(l => <option key={l}>{l}</option>)}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-16 text-gray-400 gap-3">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"/>
          <p className="text-sm">Loading public decks…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🌐</p>
          <p className="text-sm font-semibold">
            {decks.length === 0 ? "No public decks yet." : "No decks match your search."}
          </p>
          <p className="text-xs mt-1 text-gray-300">
            {decks.length === 0
              ? "Be the first — publish a deck from your Library!"
              : "Try a different filter."}
          </p>
        </div>
      )}

      {/* Deck list */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map(pd => {
            const isImporting = importing === pd.docId;
            const imported    = alreadyImported(pd);
            const levelColor  = LEVELS[pd.level]?.color || "bg-gray-100 text-gray-600";
            const msg         = messages[pd.docId];

            return (
              <div key={pd.docId} className="bg-white rounded-2xl shadow border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={"text-xs px-2 py-0.5 rounded-full font-bold " + levelColor}>
                        {pd.level}
                      </span>
                      <p className="font-extrabold text-gray-800 text-sm truncate">{pd.name}</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      {pd.cards?.length ?? 0} cards &middot; by {pd.createdBy?.name || "Anonymous"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">📥 {pd.imports || 0} imports</p>
                  </div>
                  <button
                    onClick={() => handleImport(pd)}
                    disabled={isImporting || imported}
                    className={
                      "shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all " +
                      (imported
                        ? "bg-green-100 text-green-600 cursor-default"
                        : isImporting
                        ? "bg-blue-100 text-blue-400 cursor-wait"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm")
                    }
                  >
                    {imported ? "✓ Saved" : isImporting ? "Importing…" : "📥 Import"}
                  </button>
                </div>
                {msg && (
                  <p className={"text-xs font-semibold mt-2 " + (msg.startsWith("✅") ? "text-green-600" : "text-red-500")}>
                    {msg}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
