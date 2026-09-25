import React, { useState, useRef, useCallback, useMemo } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import {
  Camera, Pencil, Check, X,
  Flame, ChevronDown, ChevronUp,
  Settings, LogOut, Volume2, Smartphone,
  Coffee
} from "lucide-react";
import answerFeedback from "../audio/answerFeedback";
import { DB } from "../App";

// ── Shared constants (mirror App.jsx values) ──────────────────
const BADGES = [
  { xp: 0,    icon: "🌱", label: "Anfänger",        color: "text-green-500"  },
  { xp: 100,  icon: "📖", label: "Lernender",        color: "text-blue-500"   },
  { xp: 300,  icon: "⭐", label: "Fortschritt",      color: "text-yellow-500" },
  { xp: 600,  icon: "🎯", label: "Geübt",            color: "text-orange-500" },
  { xp: 1000, icon: "🔥", label: "Fortgeschritten",  color: "text-red-500"    },
  { xp: 2000, icon: "💎", label: "Experte",          color: "text-purple-500" },
  { xp: 5000, icon: "👑", label: "Meister",          color: "text-amber-500"  },
];
const getBadge = xp => [...BADGES].reverse().find(b => xp >= b.xp) || BADGES[0];

const THEME_PREFERENCES = { SYSTEM: "system", LIGHT: "light", DARK: "dark" };

// ── Activity heatmap helpers ──────────────────────────────────
function buildHeatmap(activityLog, weeks = 16) {
  const today = new Date();
  const cells = [];
  // Pad so grid always starts on Sunday
  const todayDow = today.getDay(); // 0=Sun
  const endOffset = 6 - todayDow; // days until end of this week (Sat)
  const totalDays = weeks * 7;
  for (let i = totalDays - 1 - endOffset; i >= -endOffset; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toDateString();
    cells.push({ key, count: activityLog[key] || 0, isToday: i === 0, date: d });
  }
  return cells; // length = weeks * 7, left→right = old→new
}

function intensityClass(count) {
  if (count === 0)  return "dh-heat-0";
  if (count <= 2)   return "dh-heat-1";
  if (count <= 5)   return "dh-heat-2";
  if (count <= 10)  return "dh-heat-3";
  return "dh-heat-4";
}

function longestStreak(history) {
  if (!history.length) return 0;
  const sorted = [...new Set(history)].sort();
  let max = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr - prev) / 86400000;
    if (diff === 1) { cur++; max = Math.max(max, cur); }
    else cur = 1;
  }
  return max;
}

// ── Photo upload helper ───────────────────────────────────────
async function compressAndUpload(file, uid) {
  return new Promise((resolve, reject) => {
    const MAX = 300; // px
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = async () => {
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = MAX; canvas.height = MAX;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, sx, sy, size, size, 0, 0, MAX, MAX);
        canvas.toBlob(async blob => {
          if (!blob) { reject(new Error("Canvas conversion failed")); return; }
          try {
            const storageRef = ref(storage, `avatars/${uid}.jpg`);
            await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
            const url = await getDownloadURL(storageRef);
            resolve(url);
          } catch (err) { reject(err); }
        }, "image/jpeg", 0.85);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── Sub-components ────────────────────────────────────────────

function Avatar({ photoURL, name, size = 72, onUploadStart, onUploadDone, onUploadError, uid }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const handleFile = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { onUploadError("Image must be under 1 MB"); return; }
    setUploading(true);
    onUploadStart?.();
    try {
      const url = await compressAndUpload(file, uid);
      onUploadDone(url);
    } catch {
      onUploadError("Upload failed — try again");
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div
      className="dh-profile-avatar-wrap"
      style={{ width: size, height: size }}
      onClick={() => !uploading && fileRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Change profile photo"
      onKeyDown={e => e.key === "Enter" && fileRef.current?.click()}
    >
      {photoURL
        ? <img src={photoURL} alt={name} className="dh-profile-avatar-img" />
        : <div className="dh-profile-avatar-initials">{initials}</div>
      }
      <div className={`dh-profile-avatar-overlay ${uploading ? "dh-profile-avatar-overlay--busy" : ""}`} aria-hidden="true">
        {uploading
          ? <div className="dh-profile-avatar-spinner" />
          : <Camera size={16} />
        }
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFile}
        aria-hidden="true"
      />
    </div>
  );
}

function EditableText({ value, onSave, placeholder, maxLength = 80, className = "", multiline = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const inputRef = useRef(null);

  const start = () => { setDraft(value || ""); setEditing(true); setTimeout(() => inputRef.current?.focus(), 0); };
  const cancel = () => setEditing(false);
  const save = () => { onSave(draft.trim()); setEditing(false); };

  if (editing) {
    const props = {
      ref: inputRef,
      value: draft,
      onChange: e => setDraft(e.target.value),
      maxLength,
      onKeyDown: e => {
        if (e.key === "Enter" && !multiline) save();
        if (e.key === "Escape") cancel();
      },
      onBlur: save,
      className: "dh-editable-input " + className,
      placeholder,
    };
    return multiline
      ? <textarea {...props} rows={2} style={{ resize: "none" }} />
      : <input type="text" {...props} />;
  }

  return (
    <button
      type="button"
      onClick={start}
      className={"dh-editable-trigger " + className}
      aria-label={`Edit ${placeholder}`}
    >
      {value || <span className="dh-editable-placeholder">{placeholder}</span>}
      <Pencil size={12} className="dh-editable-pencil" aria-hidden="true" />
    </button>
  );
}

function ActivityHeatmap({ activityLog, history, streak }) {
  const [expanded, setExpanded] = useState(false);
  const weeks = expanded ? 16 : 7;
  const cells = useMemo(() => buildHeatmap(activityLog, weeks), [activityLog, weeks]);
  const totalActive = Object.values(activityLog).filter(v => v > 0).length
    + history.filter(d => !activityLog[d]).length; // legacy history entries
  const best = useMemo(() => longestStreak(
    [...new Set([...history, ...Object.keys(activityLog).filter(k => activityLog[k] > 0)])]
  ), [history, activityLog]);

  // Month labels — find first occurrence of each month in the grid
  const monthLabels = useMemo(() => {
    const seen = {};
    return cells.reduce((acc, cell, i) => {
      const col = Math.floor(i / 7);
      const m = cell.date.toLocaleString("en", { month: "short" });
      if (!seen[m]) { seen[m] = true; acc.push({ col, label: m }); }
      return acc;
    }, []);
  }, [cells]);

  return (
    <div className="dh-profile-card">
      <div className="dh-profile-card-header">
        <p className="dh-profile-section-label">Activity</p>
        <button
          type="button"
          className="dh-profile-expand-btn"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
        >
          {expanded ? <><ChevronUp size={14}/> Less</> : <><ChevronDown size={14}/> {weeks * 7} days</>}
        </button>
      </div>

      {/* Month labels */}
      <div className="dh-heat-months" style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}>
        {monthLabels.map(({ col, label }) => (
          <span key={label} className="dh-heat-month-label" style={{ gridColumn: col + 1 }}>{label}</span>
        ))}
      </div>

      {/* Grid — 7 rows (days), N cols (weeks) */}
      <div
        className="dh-heat-grid"
        style={{ gridTemplateRows: "repeat(7, 1fr)", gridTemplateColumns: `repeat(${weeks}, 1fr)` }}
        aria-label={`Activity for last ${weeks * 7} days`}
        role="img"
      >
        {cells.map(cell => (
          <div
            key={cell.key}
            className={`dh-heat-cell ${intensityClass(cell.count)} ${cell.isToday ? "dh-heat-today" : ""}`}
            title={`${cell.date.toLocaleDateString("en", { month: "short", day: "numeric" })} — ${cell.count} card${cell.count !== 1 ? "s" : ""} reviewed`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="dh-heat-legend">
        <span>Less</span>
        {[0,1,2,3,4].map(i => <div key={i} className={`dh-heat-cell dh-heat-${i}`} style={{ width: 10, height: 10, borderRadius: 2 }}/>)}
        <span>More</span>
      </div>

      {/* Streak stats row */}
      <div className="dh-streak-stats">
        <div className="dh-streak-stat">
          <Flame size={16} className="dh-streak-flame" aria-hidden="true" />
          <div>
            <p className="dh-streak-stat-value">{streak}</p>
            <p className="dh-streak-stat-label">{streak === 1 ? "day" : "days"} streak</p>
          </div>
        </div>
        <div className="dh-streak-divider" />
        <div className="dh-streak-stat">
          <div>
            <p className="dh-streak-stat-value">{best}</p>
            <p className="dh-streak-stat-label">best streak</p>
          </div>
        </div>
        <div className="dh-streak-divider" />
        <div className="dh-streak-stat">
          <div>
            <p className="dh-streak-stat-value">{totalActive}</p>
            <p className="dh-streak-stat-label">active days</p>
          </div>
        </div>
      </div>

      {/* 14-day dot strip */}
      <div className="dh-streak-dots" aria-label="Last 14 days">
        {buildHeatmap(activityLog, 2).slice(-14).map((cell, i) => (
          <div
            key={cell.key}
            className={`dh-streak-dot ${cell.count > 0 ? "dh-streak-dot--active" : ""} ${cell.isToday ? "dh-streak-dot--today" : ""}`}
            title={cell.date.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
          />
        ))}
      </div>
    </div>
  );
}

const GOAL_HINTS = [
  [5,  "Light touch · ~5 min/day 🌱"],
  [10, "Casual · ~10 min/day 📖"],
  [20, "Steady · ~20 min/day 🎯"],
  [30, "Committed · ~25 min/day ⭐"],
  [50, "Intensive · ~40 min/day 🔥"],
  [75, "Serious learner · ~1 hr/day 💪"],
  [100,"Immersion mode 🚀"],
];
function goalHint(g) {
  return [...GOAL_HINTS].reverse().find(([v]) => g >= v)?.[1] || GOAL_HINTS[0][1];
}

// ── Main ProfileTab ───────────────────────────────────────────
export default function ProfileTab({
  library, xp, streak, goal, setGoal, dailyDone,
  history, activityLog,
  user, setUser, onSignOut,
  installPrompt, setInstallPrompt,
  themePreference, setThemePreference,
}) {
  const [soundOn, setSoundOn] = useState(() => answerFeedback.isEnabled());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const total    = library.reduce((a, d) => a + d.cards.length, 0);
  const learned  = library.reduce((a, d) => a + d.cards.filter(c => c.interval >= 7).length, 0);
  const due      = library.reduce((a, d) => a + d.cards.filter(c => !c.due || c.due <= Date.now() + 3600000).length, 0);
  const badge    = getBadge(xp);
  const nextBadge= BADGES.find(b => b.xp > xp) || badge;
  const xpPct    = nextBadge.xp === badge.xp ? 100 : Math.round((xp - badge.xp) / (nextBadge.xp - badge.xp) * 100);
  const goalPct  = Math.min(100, Math.round((dailyDone / Math.max(1, goal)) * 100));

  // Level breakdown — only levels with cards
  const levelData = useMemo(() => {
    const levels = ["A1","A2","B1","B2","C1","C2"];
    const LEVEL_COLORS = {
      A1: "#22c55e", A2: "#3b82f6", B1: "#f59e0b",
      B2: "#f97316", C1: "#ef4444", C2: "#8b5cf6",
    };
    return levels
      .map(l => ({
        l,
        cnt: library.filter(d => d.level === l).reduce((a, d) => a + d.cards.length, 0),
        color: LEVEL_COLORS[l],
      }))
      .filter(x => x.cnt > 0);
  }, [library]);

  const handlePhotoUploaded = useCallback(async (url) => {
    setPhotoError("");
    const updated = { ...user, photoURL: url };
    setUser(updated);
    try { await DB.setUser(user.uid, { photoURL: url }); } catch { /* non-fatal */ }
  }, [user, setUser]);

  const handleSaveName = useCallback(async (name) => {
    if (!name || name === user?.name) return;
    const updated = { ...user, name };
    setUser(updated);
    try { await DB.setUser(user.uid, { name }); } catch { /* non-fatal */ }
  }, [user, setUser]);

  const handleSaveBio = useCallback(async (bio) => {
    if (bio === (user?.bio ?? "")) return;
    const updated = { ...user, bio };
    setUser(updated);
    try { await DB.setUser(user.uid, { bio }); } catch { /* non-fatal */ }
  }, [user, setUser]);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
    setInstallPrompt(null);
  };

  return (
    <div className="flex flex-col gap-4">

      {/* ── 1. Identity card ── */}
      <div className="dh-profile-card">
        <div className="dh-profile-identity">
          <Avatar
            photoURL={user?.photoURL}
            name={user?.name}
            uid={user?.uid}
            onUploadStart={() => setPhotoError("")}
            onUploadDone={handlePhotoUploaded}
            onUploadError={setPhotoError}
          />
          <div className="dh-profile-identity-body">
            <EditableText
              value={user?.name}
              onSave={handleSaveName}
              placeholder="Your name"
              maxLength={40}
              className="dh-profile-name"
            />
            <EditableText
              value={user?.bio}
              onSave={handleSaveBio}
              placeholder="Add a bio…"
              maxLength={80}
              className="dh-profile-bio"
            />
            <div className="dh-profile-badge-row">
              <span className={badge.color + " text-sm"}>{badge.icon}</span>
              <span className="dh-profile-badge-label">{badge.label}</span>
              <span className="dh-profile-email">{user?.email}</span>
            </div>
          </div>
        </div>

        {photoError && <p className="dh-profile-photo-error">{photoError}</p>}

        {/* XP bar */}
        <div className="dh-profile-xp-row">
          <span className="dh-profile-xp-label">{xp} XP</span>
          <span className="dh-profile-xp-label">
            {nextBadge.xp > xp ? `${nextBadge.xp - xp} to ${nextBadge.icon}` : "Max rank 🌟"}
          </span>
        </div>
        <div className="dh-profile-xp-track">
          <div className="dh-profile-xp-fill" style={{ width: xpPct + "%" }} />
        </div>
      </div>

      {/* ── 2. Activity + Streak ── */}
      <ActivityHeatmap
        activityLog={activityLog}
        history={history}
        streak={streak}
      />

      {/* ── 3. Stats strip ── */}
      <div className="dh-profile-stats-strip">
        {[
          { v: total,          l: "Cards",   c: "var(--dh-color-accent)"    },
          { v: learned,        l: "Learned", c: "#22c55e"                   },
          { v: due,            l: "Due",     c: "#f59e0b"                   },
          { v: library.length, l: "Decks",   c: "#8b5cf6"                   },
        ].map((s, i) => (
          <React.Fragment key={s.l}>
            {i > 0 && <div className="dh-profile-stats-sep" />}
            <div className="dh-profile-stat-item">
              <span className="dh-profile-stat-value" style={{ color: s.c }}>{s.v}</span>
              <span className="dh-profile-stat-label">{s.l}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* ── 4. Daily goal ── */}
      <div className="dh-profile-card">
        <div className="dh-profile-card-header">
          <p className="dh-profile-section-label">Daily Goal</p>
          <span className="dh-profile-goal-today">
            {dailyDone}/{goal} today{goalPct >= 100 ? " ✓" : ""}
          </span>
        </div>
        <div className="dh-profile-goal-value">{goal} cards</div>
        <input
          type="range"
          min="5" max="100" step="5"
          value={goal}
          onChange={e => setGoal(Number(e.target.value))}
          className="dh-profile-goal-slider"
          aria-label="Daily card goal"
        />
        <div className="dh-profile-goal-range-labels">
          <span>5</span><span>50</span><span>100</span>
        </div>
        <p className="dh-profile-goal-hint">{goalHint(goal)}</p>
        <div className="dh-profile-goal-track">
          <div className="dh-profile-goal-fill" style={{ width: goalPct + "%" }} />
        </div>
      </div>

      {/* ── 5. Vocabulary breakdown ── */}
      {levelData.length > 0 && (
        <div className="dh-profile-card">
          <p className="dh-profile-section-label" style={{ marginBottom: "var(--dh-space-3)" }}>Vocabulary</p>
          {/* Stacked bar */}
          <div className="dh-vocab-bar">
            {levelData.map(({ l, cnt, color }) => (
              <div
                key={l}
                className="dh-vocab-bar-segment"
                style={{ flex: cnt, background: color }}
                title={`${l}: ${cnt} cards`}
              />
            ))}
          </div>
          {/* Labels */}
          <div className="dh-vocab-labels">
            {levelData.map(({ l, cnt, color }) => (
              <div key={l} className="dh-vocab-label-item">
                <span className="dh-vocab-dot" style={{ background: color }} />
                <span className="dh-vocab-level">{l}</span>
                <span className="dh-vocab-count">{cnt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. Settings (collapsible) ── */}
      <div className="dh-profile-card">
        <button
          type="button"
          className="dh-profile-settings-toggle"
          onClick={() => setSettingsOpen(v => !v)}
          aria-expanded={settingsOpen}
        >
          <Settings size={15} aria-hidden="true" />
          <span>Settings</span>
          {settingsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {settingsOpen && (
          <div className="dh-profile-settings-body">
            {/* Theme */}
            <div className="dh-profile-settings-row">
              <label htmlFor="dh-theme-select" className="dh-profile-settings-label">Theme</label>
              <select
                id="dh-theme-select"
                value={themePreference}
                onChange={e => setThemePreference(e.target.value)}
                className="dh-explore-level-select"
              >
                <option value={THEME_PREFERENCES.SYSTEM}>System</option>
                <option value={THEME_PREFERENCES.LIGHT}>Light</option>
                <option value={THEME_PREFERENCES.DARK}>Dark</option>
              </select>
            </div>

            {/* Sounds */}
            <div className="dh-profile-settings-row">
              <label htmlFor="dh-sound-toggle" className="dh-profile-settings-label">
                <Volume2 size={13} aria-hidden="true" /> Answer sounds
              </label>
              <button
                id="dh-sound-toggle"
                role="switch"
                aria-checked={soundOn}
                onClick={() => { const n = !soundOn; setSoundOn(n); answerFeedback.setEnabled(n); }}
                className={"dh-toggle " + (soundOn ? "dh-toggle--on" : "")}
              >
                <span className="dh-toggle-thumb" />
              </button>
            </div>

            {/* Install */}
            {installPrompt && (
              <button onClick={handleInstall} className="dh-profile-settings-action">
                <Smartphone size={13} aria-hidden="true" /> Install app
              </button>
            )}

            {/* Sign out */}
            <button onClick={onSignOut} className="dh-profile-settings-action dh-profile-signout">
              <LogOut size={13} aria-hidden="true" /> Sign out
            </button>
          </div>
        )}
      </div>

      {/* ── 7. Support ── */}
      <div id="support-section" className="dh-profile-card dh-support-card">
        <div className="flex items-center gap-2 mb-2">
          <Coffee size={16} className="text-amber-500" aria-hidden="true" />
          <p className="dh-profile-section-label">Support Deutsch Hub</p>
        </div>
        <p className="dh-support-sub">
          Deutsch Hub is built to help students learn German faster and more effectively.
          If this platform helps you, you can support its growth ☕
        </p>
        <div className="dh-support-tiers">
          <div className="dh-support-tier"><span>₹20</span><span>→ Buy a coffee</span></div>
          <div className="dh-support-tier"><span>₹50</span><span>→ Support development</span></div>
          <div className="dh-support-tier"><span>₹100</span><span>→ Power supporter</span></div>
          <p className="dh-support-note">Choose any amount you feel comfortable with.</p>
        </div>
        <button
          className="dh-support-btn"
          onClick={() => window.open("https://rzp.io/l/deutschhub", "_blank", "noopener")}
        >
          ☕ Support Deutsch Hub
        </button>
      </div>

    </div>
  );
}
