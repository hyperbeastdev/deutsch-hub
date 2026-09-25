import React, { useState, useEffect } from "react";
import { Compass, Download, Check, Users } from "lucide-react";
import { LEVELS } from "../config/constants";
import { DB } from "../App";

const LEVEL_OPTIONS = ["All", "A1", "A2", "B1", "B2", "C1", "C2"];

export default function ExploreTab({ library, setLibrary, user }) {
  const [decks, setDecks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [levelFilter, setLevel]   = useState("All");
  const [importing, setImporting] = useState(null);
  const [messages, setMessages]   = useState({});

  useEffect(() => {
    DB.getPublicDecks().then(d => { setDecks(d); setLoading(false); });
  }, []);

  const setMsg = (docId, msg) =>
    setMessages(prev => ({ ...prev, [docId]: msg }));

  const alreadyImported = (pd) =>
    library.some(d => d.name === pd.name && d.cards.length === pd.cards.length);

  const handleImport = async (pd) => {
    if (!user) { setMsg(pd.docId, "Login required to import decks."); return; }
    if (alreadyImported(pd)) { setMsg(pd.docId, "Already in your library."); return; }
    setImporting(pd.docId);
    setMsg(pd.docId, "");

    const result = await DB.importPublicDeck(pd);

    if (result.success) {
      const newLibrary = [...library, result.deck];
      setLibrary(newLibrary);
      try { await DB.syncLibrary(user.uid, newLibrary); } catch (_) {}
      setDecks(prev => prev.map(d =>
        d.docId === pd.docId ? { ...d, imports: (d.imports || 0) + 1 } : d
      ));
      setMsg(pd.docId, "Added to your library.");
    } else {
      const errMap = { import_failed: "Import failed. Please try again." };
      setMsg(pd.docId, errMap[result.error] || "Something went wrong.");
    }
    setImporting(null);
  };

  const filtered = decks.filter(d => {
    const matchSearch = d.name?.toLowerCase().includes(search.toLowerCase());
    const matchLevel  = levelFilter === "All" || d.level === levelFilter;
    return matchSearch && matchLevel;
  });

  return (
    <div className="dh-explore">

      {/* ── Header */}
      <div className="dh-explore-header">
        <div>
          <h2 className="dh-explore-title">
            <Compass size={20} aria-hidden="true" />
            Explore Decks
          </h2>
          <p className="dh-explore-subtitle">Community-published German flashcard decks</p>
        </div>
      </div>

      {/* ── Filters */}
      <div className="dh-explore-filters">
        <div className="dh-explore-search-wrap">
          <svg className="dh-explore-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            className="dh-explore-search"
            placeholder="Search decks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search community decks"
          />
        </div>
        <select
          className="dh-explore-level-select"
          value={levelFilter}
          onChange={e => setLevel(e.target.value)}
          aria-label="Filter by level"
        >
          {LEVEL_OPTIONS.map(l => <option key={l}>{l}</option>)}
        </select>
      </div>

      {/* ── Loading */}
      {loading && (
        <div className="dh-explore-empty">
          <div className="dh-explore-spinner" aria-label="Loading" role="status"/>
          <p>Loading decks…</p>
        </div>
      )}

      {/* ── Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="dh-explore-empty">
          <Compass size={36} className="dh-explore-empty-icon" aria-hidden="true"/>
          <p className="dh-explore-empty-heading">
            {decks.length === 0 ? "No public decks yet." : "No decks match your search."}
          </p>
          <p className="dh-explore-empty-sub">
            {decks.length === 0
              ? "Be the first — publish a deck from your Library!"
              : "Try a different search or level filter."}
          </p>
        </div>
      )}

      {/* ── Deck grid */}
      {!loading && filtered.length > 0 && (
        <div className="dh-library-grid">
          {filtered.map(pd => {
            const isImporting = importing === pd.docId;
            const imported    = alreadyImported(pd);
            const levelCls    = LEVELS[pd.level]?.color || "bg-gray-100 text-gray-600";
            const msg         = messages[pd.docId];
            const cardCount   = pd.cards?.length ?? 0;
            const importCount = pd.imports || 0;

            return (
              <div
                key={pd.docId}
                className={"dh-deck-card " + (imported ? "dh-deck-card--mastered" : "dh-deck-card--fresh")}
              >
                {/* Card header */}
                <div className="dh-deck-card-header">
                  <div className={`dh-deck-level-badge ${levelCls}`}>{pd.level}</div>
                  <div className="dh-deck-card-title-block">
                    <p className="dh-deck-name">{pd.name}</p>
                    <div className="dh-deck-meta">
                      <span>{cardCount} {cardCount === 1 ? "card" : "cards"}</span>
                      {pd.createdBy?.name && (
                        <>
                          <span className="dh-deck-meta-dot">·</span>
                          <span>by {pd.createdBy.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Import count row */}
                <div className="dh-explore-deck-stats">
                  <Users size={12} aria-hidden="true"/>
                  <span>{importCount} {importCount === 1 ? "import" : "imports"}</span>
                </div>

                {/* Import / Saved button */}
                <button
                  type="button"
                  onClick={() => handleImport(pd)}
                  disabled={isImporting || imported}
                  className={
                    "dh-deck-open-btn " +
                    (imported ? "dh-explore-btn-saved"
                    : isImporting ? "dh-explore-btn-loading"
                    : "dh-explore-btn-import")
                  }
                  aria-label={imported ? `${pd.name} already saved` : `Import ${pd.name}`}
                >
                  {imported
                    ? <><Check size={13} aria-hidden="true"/><span>Saved to library</span></>
                    : isImporting
                    ? <span>Importing…</span>
                    : <><Download size={13} aria-hidden="true"/><span>Import deck</span></>}
                  {!imported && !isImporting && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  )}
                </button>

                {/* Feedback message */}
                {msg && (
                  <p className={"dh-explore-msg " + (msg.startsWith("Added") || msg.startsWith("Already") ? "dh-explore-msg-ok" : "dh-explore-msg-err")}>
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
