import { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, limit, updateDoc, increment, where } from "firebase/firestore";
import { generateAIFlashcards, generateAITutorResponse } from "./ai/service";
import { getAIUserMessage } from "./ai/errors";
import AppShell from "./components/AppShell";
import { SpeakBtn, GBadge } from "./components/SharedUI";
import DeckDetail from "./components/DeckDetail";
import AITutorModal from "./components/AITutorModal";
import ExploreTab from "./components/ExploreTab";
import ProfileTab from "./components/ProfileTab";
import { SUPPORT_URL } from "./config/supportLinks";
import { authService } from "./auth/authService";
import { PROFILE_STATES, readUserProfile } from "./auth/profileRepository";
import { normalizeAuthError } from "./auth/authErrors";
import useDialogA11y from "./hooks/useDialogA11y";
import {
  THEME_PREFERENCES,
  applyTheme,
  getStoredThemePreference,
  saveThemePreference,
} from "./theme/theme";
import {
  ArrowLeft, Pencil, Trash2, Download, Library as LibraryIcon,
  Bell, Target, Brain, BookOpen, Trophy,
  Plus, RotateCcw, Volume2, Headphones, Gauge,
  X, Check, ClipboardList, Save, ChevronDown, ChevronUp, Bot,
} from "lucide-react";
import answerFeedback from "./audio/answerFeedback";

export { generateAIFlashcards };

// ═══════════════════════════════════════════════════════════
// CONSTANTS & DATA
// ═══════════════════════════════════════════════════════════
export const uid = () => Math.random().toString(36).slice(2,9);
export const today = () => new Date().toDateString();
const xpFor = r => [5,10,15,25][r];

const BADGES = [
  { xp:0,    label:"Anfänger",      icon:"🌱", color:"text-green-600"  },
  { xp:100,  label:"Lerner",        icon:"📖", color:"text-blue-500"   },
  { xp:300,  label:"Schüler",       icon:"✏️", color:"text-indigo-500" },
  { xp:600,  label:"Kenner",        icon:"🎯", color:"text-purple-500" },
  { xp:1000, label:"Fortgeschritten",icon:"⚡",color:"text-yellow-500" },
  { xp:2000, label:"Experte",       icon:"🏆", color:"text-orange-500" },
  { xp:4000, label:"Meister",       icon:"🌟", color:"text-rose-500"   },
];
const getBadge = xp => [...BADGES].reverse().find(b=>xp>=b.xp)||BADGES[0];

const LEVELS = {
  A1:{ label:"A1 – Beginner",         color:"bg-green-100 text-green-800",  border:"border-green-300"  },
  A2:{ label:"A2 – Elementary",       color:"bg-blue-100 text-blue-800",    border:"border-blue-300"   },
  B1:{ label:"B1 – Intermediate",     color:"bg-yellow-100 text-yellow-800",border:"border-yellow-300" },
  B2:{ label:"B2 – Upper-Intermediate",color:"bg-red-100 text-red-800",     border:"border-red-300"    },
  C1:{ label:"C1 – Advanced",         color:"bg-purple-100 text-purple-800",border:"border-purple-300" },
  C2:{ label:"C2 – Mastery",          color:"bg-indigo-100 text-indigo-800",border:"border-indigo-300" },
};

const GRAMMAR = {
  A1:[
    { title:"sein – Präsens",       content:"ich bin - du bist - er/sie/es ist\nwir sind - ihr seid - sie/Sie sind" },
    { title:"haben – Präsens",      content:"ich habe - du hast - er/sie/es hat\nwir haben - ihr habt - sie/Sie haben" },
    { title:"Regular verb: machen", content:"ich mache - du machst - er macht\nwir machen - ihr macht - sie machen" },
    { title:"Articles (Nominative)",content:"Masculine: der Hund\nFeminine: die Katze\nNeuter: das Kind\nPlural: die (always)" },
    { title:"Numbers 1–20",         content:"1 eins - 2 zwei - 3 drei - 4 vier - 5 fünf\n6 sechs - 7 sieben - 8 acht - 9 neun - 10 zehn\n11 elf - 12 zwölf - 13 dreizehn - 20 zwanzig" },
  ],
  A2:[
    { title:"Perfekt formation",    content:"haben/sein + Partizip II\nRegular: ge-+stem+-(e)t → gemacht\nIrregular: ge-+stem+-en → gegangen\nSein: motion/change-of-state verbs" },
    { title:"Modal verbs (Präsens)",content:"können: ich kann, du kannst, er kann\nmüssen: ich muss, du musst, er muss\nwollen: ich will, du willst, er will" },
    { title:"Akkusativ case",       content:"der→den (m) - die→die (f) - das→das (n)" },
    { title:"Dativ case",           content:"dem(m/n) - der(f) - den+n(pl)\nAfter: mit, nach, aus, bei, seit, von, zu" },
    { title:"Comparatives",         content:"groß → größer → am größten\nschnell → schneller → am schnellsten\nIrregular: gut→besser→am besten" },
  ],
  B1:[
    { title:"Adjective endings (Nom.)", content:"With der/die/das: -e\nWith ein/eine: -er/-e/-es\nWithout article: -er/-e/-es" },
    { title:"Subordinating conjunctions",content:"weil, dass, obwohl, wenn, als, damit\n→ verb moves to END of clause" },
    { title:"Separable verbs",      content:"aufmachen → ich mache auf\nanrufen → ich rufe an" },
    { title:"Passive (Präsens)",    content:"werden + Partizip II\nDas Buch wird gelesen." },
    { title:"Genitive case",        content:"des Mannes / der Frau / des Kindes\nAfter: wegen, trotz, während, statt" },
  ],
  B2:[
    { title:"Konjunktiv II – Present",content:"sein→wäre - haben→hätte\nkönnen→könnte - würde+Infinitiv" },
    { title:"Konjunktiv II – Past", content:"hätte/wäre + Partizip II\nIch hätte das gemacht." },
    { title:"Indirect speech",      content:"Er sagt, er sei müde.\nSie sagt, sie habe keine Zeit." },
    { title:"Extended adjective",   content:"das schnell fahrende Auto\n(participle as adjective + adverb)" },
  ],
};

const STARTER = [
  {id:"s1",front:"the dog",back:"der Hund",gender:"der",plural:"die Hunde",exampleDe:"Der Hund ist groß.",exampleEn:"The dog is big."},
  {id:"s2",front:"the cat",back:"die Katze",gender:"die",plural:"die Katzen",exampleDe:"Die Katze schläft.",exampleEn:"The cat is sleeping."},
  {id:"s3",front:"the child",back:"das Kind",gender:"das",plural:"die Kinder",exampleDe:"Das Kind spielt.",exampleEn:"The child is playing."},
  {id:"s4",front:"the bread",back:"das Brot",gender:"das",plural:"die Brote",exampleDe:"Ich esse das Brot.",exampleEn:"I eat the bread."},
  {id:"s5",front:"the woman",back:"die Frau",gender:"die",plural:"die Frauen",exampleDe:"Die Frau arbeitet.",exampleEn:"The woman works."},
  {id:"s6",front:"the man",back:"der Mann",gender:"der",plural:"die Männer",exampleDe:"Der Mann liest.",exampleEn:"The man reads."},
  {id:"s7",front:"the house",back:"das Haus",gender:"das",plural:"die Häuser",exampleDe:"Das Haus ist alt.",exampleEn:"The house is old."},
  {id:"s8",front:"to go",back:"gehen",gender:"verb",plural:"",exampleDe:"Ich gehe in die Schule.",exampleEn:"I go to school."},
  {id:"s9",front:"to eat",back:"essen",gender:"verb",plural:"",exampleDe:"Wir essen Abendessen.",exampleEn:"We eat dinner."},
  {id:"s10",front:"to speak",back:"sprechen",gender:"verb",plural:"",exampleDe:"Sie spricht Deutsch.",exampleEn:"She speaks German."},
  {id:"s11",front:"the water",back:"das Wasser",gender:"das",plural:"die Wasser",exampleDe:"Ich trinke Wasser.",exampleEn:"I drink water."},
  {id:"s12",front:"the school",back:"die Schule",gender:"die",plural:"die Schulen",exampleDe:"Die Schule beginnt um 8 Uhr.",exampleEn:"School starts at 8."},
];

const WOTD_LIST = [
  {word:"der Augenblick",en:"the moment",ex:"Genieße jeden Augenblick.",gender:"der"},
  {word:"die Sehnsucht",en:"longing / yearning",ex:"Sie hat Sehnsucht nach Hause.",gender:"die"},
  {word:"das Fernweh",en:"wanderlust",ex:"Fernweh treibt mich in die Welt.",gender:"das"},
  {word:"die Gemütlichkeit",en:"cosiness / conviviality",ex:"Das Café hat viel Gemütlichkeit.",gender:"die"},
  {word:"der Weltschmerz",en:"world-weariness",ex:"Manchmal fühle ich Weltschmerz.",gender:"der"},
  {word:"das Fingerspitzengefühl",en:"sensitivity / tact",ex:"Er handelt mit Fingerspitzengefühl.",gender:"das"},
  {word:"die Verschlimmbessern",en:"making things worse while trying to improve",ex:"Pass auf, das ist reines Verschlimmbessern.",gender:"die"},
  {word:"der Torschlusspanik",en:"fear of missing out",ex:"Torschlusspanik treibt sie an.",gender:"der"},
];

const GS = {
  der:{badge:"bg-blue-600 text-white",soft:"bg-blue-50 text-blue-700 border-blue-200",label:"der"},
  die:{badge:"bg-rose-500 text-white",soft:"bg-rose-50 text-rose-700 border-rose-200",label:"die"},
  das:{badge:"bg-emerald-600 text-white",soft:"bg-emerald-50 text-emerald-700 border-emerald-200",label:"das"},
  verb:{badge:"bg-purple-600 text-white",soft:"bg-purple-50 text-purple-700 border-purple-200",label:"verb"},
};

// ── SM-2 SRS ────────────────────────────────────────────────
const sm2 = (card, rating) => {
  const q = [0,3,4,5][rating];
  let {ef=2.5,interval=1,reps=0} = card;
  // Weak word tracking (safe defaults for existing cards)
  let failureCount = card.failureCount ?? 0;
  let confidenceScore = card.confidenceScore ?? 70;
  if (q<3) {
    reps=0; interval=1;
    failureCount++;
    confidenceScore = Math.max(0, confidenceScore - 20);
  } else {
    reps++;
    if(reps===1)interval=1; else if(reps===2)interval=6; else interval=Math.round(interval*ef);
    ef=Math.max(1.3,ef+0.1-(5-q)*(0.08+(5-q)*0.02));
    const boost = q===5 ? 15 : q===4 ? 10 : 5;
    confidenceScore = Math.min(100, confidenceScore + boost);
  }
  return {...card, ef, interval, reps, failureCount, confidenceScore, due:Date.now()+interval*86400000, lastRating:rating};
};
const isDue = c => !c.due || c.due<=Date.now()+3600000;
export const isWeak = c => (c.confidenceScore ?? 70) < 40 || (c.failureCount ?? 0) >= 3;

// ── FIREBASE DB ──────────────────────────────────────────────
export const DB = {
  async getUser(uid) { return readUserProfile(uid); },
  async setUser(uid, data) { 
    try { await setDoc(doc(db,"users",uid), data, { merge: true }); } catch(e) { console.error(e); }
  },
  async getLeaderboard() {
    try {
      const qs=await getDocs(query(collection(db,"users"),orderBy("xp","desc"),limit(10)));
      return qs.docs.map(d=>{const u=d.data();return {uid:u.uid,name:u.name,avatar:u.avatar||"😊",xp:u.xp||0,badge:getBadge(u.xp||0).icon};});
    } catch(e) { console.error(e); return []; }
  },
  async syncLibrary(uid, libraryArray) {
    try { await setDoc(doc(db,"userLibraries",uid), { decks: libraryArray }); } catch(e) { console.error(e); }
  },
  async getLibrary(uid) {
    try { const d=await getDoc(doc(db,"userLibraries",uid)); return d.exists()?(d.data().decks||[]):[]; } catch(e) { console.error(e); return []; }
  },
  async publishDeck(deck, uid) {
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const strippedCards = deck.cards.map(c => ({ front: c.front, back: c.back, gender: c.gender || "", plural: c.plural || "", exampleDe: c.exampleDe || "", exampleEn: c.exampleEn || "" }));
      await setDoc(doc(db, "sharedDecks", code), { name: deck.name, level: deck.level, authorUid: uid, createdAt: Date.now(), downloads: 0, cards: strippedCards });
      return code;
    } catch(e) { console.error(e); return null; }
  },
  async downloadSharedDeck(code) {
    try {
      const d = await getDoc(doc(db, "sharedDecks", code));
      if (!d.exists()) return null;
      return d.data();
    } catch(e) { console.error(e); return null; }
  },
  async getUserGoal(uid) {
    try { const d=await getDoc(doc(db,"userGoals",uid)); return d.exists()?d.data():null; } catch(e) { console.error(e); return null; }
  },
  async setUserGoal(uid, goalData) {
    try { await setDoc(doc(db,"userGoals",uid), goalData, { merge: true }); } catch(e) { console.error(e); }
  },
  async getMissions(uid) {
    try { const d=await getDoc(doc(db,"userMissions",uid)); return d.exists()?d.data():null; } catch(e) { console.error(e); return null; }
  },
  async setMissions(uid, data) {
    try { await setDoc(doc(db,"userMissions",uid), data, { merge: true }); } catch(e) { console.error(e); }
  },

  // ── Public Deck Methods ─────────────────────────────────────
  async publishPublicDeck(deck, user) {
    try {
      if (!user) return { error: "not_logged_in" };
      if (!deck.cards || deck.cards.length === 0) return { error: "empty_deck" };

      // Check for duplicate — graceful fallback if Firestore index not ready
      try {
        const existing = await getDocs(
          query(collection(db, "publicDecks"),
            where("originalDeckId", "==", deck.id),
            where("createdBy.uid", "==", user.uid))
        );
        if (!existing.empty) return { error: "already_published" };
      } catch (indexErr) {
        console.warn("Duplicate check skipped (index not ready):", indexErr.message);
      }

      // Strip SRS fields — keep only display fields
      const cleanCards = deck.cards.map(c => ({
        id: uid() + Date.now(),
        front: c.front || "",
        back: c.back || "",
        gender: c.gender || "",
        plural: c.plural || "",
        exampleDe: c.exampleDe || "",
        exampleEn: c.exampleEn || "",
      }));

      const publicDeck = {
        id: uid() + Date.now(),
        name: deck.name,
        level: deck.level || "A1",
        cards: cleanCards,
        createdAt: Date.now(),
        createdBy: { uid: user.uid, name: user.displayName || user.name || "Anonymous" },
        originalDeckId: deck.id,
        imports: 0,
        likes: 0,
        tags: [],
      };

      await setDoc(doc(db, "publicDecks", publicDeck.id), publicDeck);
      return { success: true };
    } catch (e) {
      console.error(e);
      return { error: "publish_failed" };
    }
  },

  async getPublicDecks() {
    try {
      const qs = await getDocs(
        query(collection(db, "publicDecks"), orderBy("imports", "desc"), limit(50))
      );
      return qs.docs.map(d => ({ docId: d.id, ...d.data() }));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  // Returns the new deck object — App.jsx handles setLibrary
  async importPublicDeck(publicDeck) {
    try {
      const newDeck = {
        id: uid() + Date.now(),
        name: publicDeck.name,
        level: publicDeck.level || "A1",
        created: Date.now(),
        cards: publicDeck.cards.map(c => ({
          ...c,
          id: uid() + Date.now(),
          interval: 1,
          ef: 2.5,
          repetition: 0,
          due: null,
        })),
      };
      // Increment the import counter on the public deck doc
      try {
        await updateDoc(doc(db, "publicDecks", publicDeck.docId), {
          imports: increment(1),
        });
      } catch (e) {
        console.warn("Could not increment import count:", e.message);
      }
      return { success: true, deck: newDeck };
    } catch (e) {
      console.error(e);
      return { error: "import_failed" };
    }
  },
};

// ═══════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════


// ── ONBOARDING ────────────────────────────────────────────────
function Onboarding({onComplete}) {
  const [step,setStep] = useState(0);
  const [name,setName] = useState("");
  const [level,setLevel] = useState("A1");
  const [goal,setGoal] = useState(20);

  const steps = [
    {
      icon:"🇩🇪", title:"Welcome to Deutsch Hub",
      sub:"Your smart German learning companion powered by AI & spaced repetition.",
      content: (
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-600">What's your name?</label>
          <input className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-blue-400"
            placeholder="Enter your name…" value={name} onChange={e=>setName(e.target.value)} autoFocus/>
        </div>
      )
    },
    {
      icon:"📊", title:"What's your level?",
      sub:"We'll personalise your AI-generated cards and grammar references.",
      content:(
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(LEVELS).map(([l,v])=>(
            <button key={l} onClick={()=>setLevel(l)} className={"rounded-2xl p-4 border-2 text-left transition-all " + (level===l?"border-blue-500 bg-blue-50":"border-gray-200 bg-white hover:border-blue-300")}>
              <span className={"text-xs font-bold px-2 py-0.5 rounded-full " + (v.color)}>{l}</span>
              <p className="text-xs text-gray-500 mt-1 leading-tight">{v.label.split("–")[1].trim()}</p>
            </button>
          ))}
        </div>
      )
    },
    {
      icon:"🎯", title:"Set your daily goal",
      sub:"How many cards do you want to review each day?",
      content:(
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap justify-center">
            {[5,10,20,30,50].map(g=>(
              <button key={g} onClick={()=>setGoal(g)}
                className={"px-5 py-3 rounded-2xl text-sm font-bold border-2 transition-all " + (goal===g?"border-blue-500 bg-blue-50 text-blue-700":"border-gray-200 bg-white text-gray-600 hover:border-blue-300")}>
                {g} cards/day
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400">{goal<10?"A gentle start 🌱":goal<30?"A solid habit 📖":goal<50?"Serious learner ⚡":"Immersion mode 🚀"}</p>
        </div>
      )
    },
  ];

  const cur = steps[step];
  const canNext = step===0?name.trim().length>0:true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7">
        <div className="flex justify-center gap-1.5 mb-6">
          {steps.map((_,i)=><div key={i} className={"h-1.5 rounded-full transition-all " + (i<=step?"bg-blue-500":"bg-gray-200") + " " + (i===step?"w-8":"w-4")}/>)}
        </div>
        <div className="text-center mb-6">
          <p className="text-4xl mb-3">{cur.icon}</p>
          <h2 className="text-xl font-extrabold text-gray-800 mb-1">{cur.title}</h2>
          <p className="text-sm text-gray-400">{cur.sub}</p>
        </div>
        <div className="mb-6">{cur.content}</div>
        <div className="flex gap-3">
          {step>0&&<button onClick={()=>setStep(s=>s-1)} className="flex-1 py-3 border-2 border-gray-200 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50">← Back</button>}
          <button onClick={()=>{
            if(step<steps.length-1){if(canNext)setStep(s=>s+1);}
            else onComplete({name:name.trim()||"Learner",level,goal});
          }} disabled={step===0&&!canNext}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-2xl text-sm font-extrabold transition-colors">
            {step<steps.length-1?"Continue →":"Start Learning 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AUTH SCREEN ───────────────────────────────────────────────
function AuthScreen({onGoogle, onCancelGoogle, googleLoading, authError}) {
  const googleButtonRef = useRef(null);

  useEffect(() => {
    if (authError) googleButtonRef.current?.focus();
  }, [authError]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
        <p className="text-5xl mb-3">🇩🇪</p>
        <h1 className="text-2xl font-extrabold text-gray-800 mb-1">Deutsch Hub</h1>
        <p className="text-sm text-gray-400 mb-7">AI-powered German flashcards<br/>with spaced repetition</p>

        <div className="flex flex-col gap-3 mb-5">
          <button ref={googleButtonRef} type="button" onClick={onGoogle} disabled={googleLoading} aria-busy={googleLoading} aria-describedby={authError ? "auth-error" : undefined}
            className="flex items-center justify-center gap-3 w-full border-2 border-gray-200 rounded-2xl py-3 font-bold text-gray-700 hover:bg-gray-50 transition-colors text-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? "Opening Google…" : "Continue with Google"}
          </button>
          {googleLoading && <button type="button" onClick={onCancelGoogle} className="text-xs text-gray-500 underline underline-offset-2 hover:text-gray-700">Cancel sign-in</button>}
          {googleLoading && <p role="status" className="text-xs text-gray-500 mt-2">Waiting for the sign-in window…</p>}
          {authError && <p id="auth-error" role="alert" className="text-sm text-red-600 mt-3">{authError.message}</p>}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          {[["🃏","Smart SRS"],["✨","AI Cards"],["🏆","Leaderboard"]].map(([i,l])=>(
            <div key={l} className="bg-gray-50 rounded-xl p-2">
              <p className="text-xl">{i}</p>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── WORD OF THE DAY ───────────────────────────────────────────
function WordOfDay({addXP}) {
  const todayKey = "wotd_claimed_" + new Date().toDateString(); // e.g. "wotd_claimed_Fri Apr 11 2025"
  const [claimed, setClaimed] = useState(() => !!localStorage.getItem(todayKey));

  const idx = new Date().getDate() % WOTD_LIST.length;
  const w = WOTD_LIST[idx];

  const claim = () => {
    if (claimed) return;
    addXP(10);
    localStorage.setItem(todayKey, "1");
    setClaimed(true);
  };

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-widest opacity-75">✨ Word of the Day</p>
        {!claimed
          ? <button onClick={claim} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full font-bold transition-colors">+10 XP Claim</button>
          : <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold">✓ Claimed!</span>
        }
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <GBadge g={w.gender} size="lg"/>
        <p className="min-w-0 flex-1 break-words text-xl font-extrabold">{w.word}</p>
        <span className="w-full shrink-0 flex justify-end sm:w-auto">
          <SpeakBtn text={w.word}/>
        </span>
      </div>
      <p className="text-sm opacity-90 font-medium">{w.en}</p>
      <p className="text-xs opacity-70 mt-1 italic">{w.ex}</p>
    </div>
  );
}

// ── DUE BANNER ────────────────────────────────────────────────
function DueBanner({library,onStudyAll}) {
  const total = library.reduce((a,d)=>a+d.cards.filter(isDue).length,0);
  if(!total) return null;
  return (
    <button onClick={onStudyAll} className="w-full bg-red-50 border-2 border-red-200 rounded-2xl p-3 flex items-center gap-3 hover:bg-red-100 transition-colors text-left">
      <span className="text-2xl">🔔</span>
      <div className="flex-1">
        <p className="text-sm font-bold text-red-700">{total} cards due for review!</p>
        <p className="text-xs text-red-500">Keep your streak alive — tap to study</p>
      </div>
      <span className="text-red-400 text-lg">→</span>
    </button>
  );
}

// ── STREAK CALENDAR ───────────────────────────────────────────
function StreakCalendar({history}) {
  const days = [];
  for(let i=6;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    days.push({label:["Su","Mo","Tu","We","Th","Fr","Sa"][d.getDay()],done:history.includes(d.toDateString())});
  }
  return (
    <div className="flex gap-1 justify-center">
      {days.map((d,i)=>(
        <div key={i} className="flex flex-col items-center gap-1">
          <div className={"w-8 h-8 rounded-xl flex items-center justify-center text-base " + (d.done?"bg-orange-400 text-white":"bg-gray-100 text-gray-300")}>{d.done?<span aria-hidden="true">🔥</span>:"-"}</div>
          <p className="text-[10px] text-gray-400 font-semibold">{d.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── LISTENING QUIZ ────────────────────────────────────────────
export function ListeningQuiz({deck,onBack,addXP}) {
  const cards = deck.cards.filter(c=>c.back);
  const [idx,setIdx] = useState(0);
  const [chosen,setChosen] = useState(null);
  const [score,setScore] = useState(0);
  const [done,setDone] = useState(false);

  const q = cards[idx];
  const opts = useMemo(()=>{
    if(!q) return [];
    const w=cards.filter(c=>c.id!==q.id).sort(()=>Math.random()-0.5).slice(0,3);
    return [...w,q].sort(()=>Math.random()-0.5);
  },[idx,cards.length]);

  // Play German text via Web Speech API — works on localhost & Firebase production
  const playAudio = (text, playbackRate = 1) => {
    const synth = window.speechSynthesis;
    if (!synth || !text) return;

    // Resume in case synth is paused, then cancel any active utterance
    synth.resume();
    synth.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang   = "de-DE";
    u.rate   = playbackRate < 1 ? 0.65 : 0.95;
    u.pitch  = 1;
    u.volume = 1;

    // Pick best available German voice
    const voices = synth.getVoices();
    const voice  =
      voices.find(v => v.name === "Google Deutsch") ||
      voices.find(v => /german/i.test(v.name))     ||
      voices.find(v => v.lang?.startsWith("de-DE")) ||
      voices.find(v => v.lang?.startsWith("de"))    ||
      null;
    if (voice) u.voice = voice;

    // Chrome keep-alive pulse (prevents silent stall on longer words)
    let pulse = null;
    u.onstart = () => {
      pulse = setInterval(() => {
        if (!synth.speaking) { clearInterval(pulse); return; }
        synth.pause();
        synth.resume();
      }, 250);
    };
    u.onend   = () => clearInterval(pulse);
    u.onerror = (e) => {
      clearInterval(pulse);
      // Retry once on spurious Chrome "canceled" error
      if (e.error === "canceled" || e.error === "interrupted") {
        setTimeout(() => synth.speak(u), 150);
      }
    };

    synth.speak(u);
  };

  const speak     = ()  => { if(q) playAudio(q.back, 1); };
  const speakSlow = ()  => { if(q) playAudio(q.back, 0.7); };

  // Auto-play at normal speed when card changes — cleanup cancels the
  // pending timer on unmount so React Strict Mode doesn't double-fire.
  useEffect(() => {
    if (!q) return;
    const timer = setTimeout(speak, 400);
    return () => clearTimeout(timer);
  }, [idx]);


  const pick=(opt)=>{
    if(chosen)return;
    setChosen(opt.id);
    if(opt.id===q.id){setScore(s=>s+1);addXP(20);answerFeedback.correct();}
    else{answerFeedback.incorrect();}
  };
  const next=()=>{setChosen(null);if(idx+1>=cards.length)setDone(true);else setIdx(i=>i+1);};

  if(cards.length<4) return <div className="text-center py-10 text-gray-400"><Headphones size={36} className="mx-auto mb-2 opacity-30" aria-hidden="true" /><p className="text-sm mt-1">Need 4+ cards for listening quiz.</p><button type="button" aria-label="Back from listening quiz" onClick={onBack} className="mt-4 text-blue-500 text-sm">← Back</button></div>;

  if(done) return (
    <div className="flex flex-col gap-4 items-center text-center">
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-8 w-full">
        <p className="text-4xl mb-3">{score===cards.length?"🏆":score>cards.length/2?"😊":"💪"}</p>
        <p className="font-extrabold text-2xl text-gray-800">{score} / {cards.length}</p>
        <p className="text-sm text-gray-500 mt-1">Listening accuracy: {Math.round(score/cards.length*100)}%</p>
      </div>
      <button onClick={()=>{setIdx(0);setScore(0);setDone(false);setChosen(null);}} className="w-full bg-blue-600 text-white font-bold py-3 rounded-2xl text-sm">🔁 Retry</button>
      <button type="button" aria-label="Back from listening results" onClick={onBack} className="w-full border border-gray-200 text-gray-500 py-3 rounded-2xl text-sm">← Back</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Back from listening quiz" onClick={onBack} className="text-gray-400 hover:text-gray-700"><ArrowLeft size={20} aria-hidden="true" /></button>
        <p className="font-bold text-gray-700 flex-1 flex items-center gap-1.5"><Headphones size={15} aria-hidden="true" /> Listening &middot; {deck.name}</p>
        <span className="text-xs text-gray-400">{idx+1}/{cards.length}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{width: ((idx/cards.length)*100) + "%"}}/>
      </div>
      <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Listen and choose the correct word</p>
        <button type="button" aria-label="Play listening prompt" onClick={speak} className="w-20 h-20 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg transition-colors"><Volume2 size={32} aria-hidden="true" /></button>
        <p className="text-xs text-gray-400 mt-3">Tap to hear again</p>
        <button type="button" aria-label="Play listening prompt slowly" onClick={speakSlow} className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors shadow-sm">
          <Gauge size={13} aria-hidden="true" /> Slow
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {opts.map(opt=>{
          let cls="bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50";
          if(chosen){if(opt.id===q.id)cls="bg-green-100 border-green-500 text-green-800";else if(opt.id===chosen)cls="bg-red-100 border-red-400 text-red-700";else cls="opacity-40 bg-white border-gray-200";}
          return <button key={opt.id} onClick={()=>pick(opt)} className={"rounded-xl border-2 p-3 text-sm font-semibold transition-all " + (cls)}><GBadge g={opt.gender}/><br/><span className="mt-1 block">{opt.back}</span></button>;
        })}
      </div>
      {chosen&&<button onClick={next} className="w-full bg-blue-600 text-white font-bold py-3 rounded-2xl text-sm">{idx+1>=cards.length?"See Results →":"Next →"}</button>}
    </div>
  );
}


// ── FLASHCARD ─────────────────────────────────────────────────
function Flashcard({card,onRate,setNote}) {
  const [flipped,setFlipped] = useState(false);
  const [editNote,setEditNote] = useState(false);
  const [noteVal,setNoteVal] = useState(card.note||"");
  const flipActionRef = useRef(null);
  const hasMounted = useRef(false);
  useEffect(()=>{setFlipped(false);setEditNote(false);setNoteVal(card.note||"");},[card.id]);
  useEffect(()=>{
    if (!hasMounted.current) { hasMounted.current = true; return; }
    flipActionRef.current?.focus();
  },[flipped]);
  const saveNote=()=>{setNote(card.id,noteVal);setEditNote(false);};
  const toggleFlipped = () => { answerFeedback.flip(); setFlipped(f => !f); };
  return (
    <div className="dh-study-card-flow">
      <div className="dh-study-card-wrap" style={{perspective:"1000px"}}>
        <div
          className={"dh-study-card " + (flipped ? "dh-study-card-revealed" : "")}
          style={{transform:flipped?"rotateY(180deg)":"rotateY(0deg)"}}
          role="group"
          aria-label={`${flipped ? "Revealed" : "Unrevealed"} study card for ${card.front}`}
        >
          <div aria-hidden={flipped} inert={flipped} className="dh-study-card-face dh-study-card-front">
            <button
              ref={!flipped ? flipActionRef : undefined}
              type="button"
              tabIndex={flipped ? -1 : 0}
              aria-expanded={flipped}
              aria-label={`Reveal answer for ${card.front}`}
              onClick={toggleFlipped}
              className="dh-study-card-flip-action"
            />
            <p className="dh-study-eyebrow">Recall in German</p>
            <p className="dh-study-prompt">{card.front}</p>
            {card.note&&<p className="dh-study-note">Note: {card.note}</p>}
            <p className="dh-study-reveal-hint">Press Enter or Space to reveal</p>
            {card.due&&<p className="dh-study-due">Due {new Date(card.due).toLocaleDateString()}</p>}
          </div>
          <div aria-hidden={!flipped} inert={!flipped} className="dh-study-card-face dh-study-card-back">
            <button
              ref={flipped ? flipActionRef : undefined}
              type="button"
              tabIndex={flipped ? 0 : -1}
              aria-expanded={flipped}
              aria-label={`Hide answer for ${card.front}`}
              onClick={toggleFlipped}
              className="dh-study-card-flip-action"
            />
            <p className="dh-study-eyebrow">German answer</p>
            <div className="dh-study-word-row">
              <span className={"dh-study-gender dh-study-gender-" + (card.gender || "unknown")} aria-label={card.gender ? `Grammatical identity: ${card.gender}` : undefined}>{card.gender || ""}</span>
              <p className="dh-study-word">{card.back}</p>
              <SpeakBtn text={card.back}/>
            </div>
            {card.plural&&card.gender!=="verb"&&<p className="dh-study-plural">Plural: {card.plural}</p>}
            {(card.exampleDe||card.exampleEn)&&<div className="dh-study-context">
              {card.exampleDe&&<p className="dh-study-example">{card.exampleDe}</p>}
              {card.exampleDe&&<div className="dh-study-context-audio"><SpeakBtn text={card.exampleDe} small/></div>}
              {card.exampleEn&&<p className="dh-study-translation">{card.exampleEn}</p>}
            </div>}
          </div>
        </div>
      </div>
      {flipped&&(
        <>
          <fieldset className="dh-study-rating">
            <legend>How well did you remember this card?</legend>
            <div className="dh-study-rating-options">
            {[{l:"Again",c:"bg-red-500 hover:bg-red-600",r:0},{l:"Hard",c:"bg-orange-400 hover:bg-orange-500",r:1},{l:"Good",c:"bg-blue-500 hover:bg-blue-600",r:2},{l:"Easy",c:"bg-green-500 hover:bg-green-600",r:3}].map(b=>(
              <button type="button" key={b.r} onClick={()=>onRate(b.r)} aria-label={`Rate this card ${b.l}`} className={"dh-study-rating-button dh-study-rating-" + b.l.toLowerCase()}>{b.l}</button>
            ))}
            </div>
          </fieldset>
          <div className="dh-study-note-control">
            {editNote?(<div className="dh-study-note-editor"><input autoFocus aria-label="Mnemonic note" className="dh-study-note-input" placeholder="Add mnemonic…" value={noteVal} onChange={e=>setNoteVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveNote()}/><button type="button" onClick={saveNote} className="dh-study-note-save">Save note</button></div>)
            :(<button type="button" onClick={e=>{e.stopPropagation();setEditNote(true);}} aria-label={card.note?"Edit mnemonic note":"Add mnemonic note"} className="dh-study-note-button">{card.note?"Edit note":"Add mnemonic note"}</button>)}
          </div>
        </>
      )}
      <p className="sr-only" role="status" aria-live="polite">{flipped?`Answer revealed: ${card.back}`:"Answer hidden"}</p>
    </div>
  );
}

// ── QUIZ MODE ─────────────────────────────────────────────────
export function QuizMode({deck,onBack,addXP}) {
  const cards = deck.cards.filter(c=>c.back);
  const [idx,setIdx] = useState(0);
  const [chosen,setChosen] = useState(null);
  const [score,setScore] = useState(0);
  const [done,setDone] = useState(false);
  const q=cards[idx];
  const opts=useMemo(()=>{if(!q)return[];const w=cards.filter(c=>c.id!==q.id).sort(()=>Math.random()-0.5).slice(0,3);return [...w,q].sort(()=>Math.random()-0.5);},[idx]);
  const pick=(opt)=>{if(chosen)return;setChosen(opt.id);if(opt.id===q.id){setScore(s=>s+1);addXP(15);answerFeedback.correct();}else{answerFeedback.incorrect();}};
  const next=()=>{setChosen(null);if(idx+1>=cards.length)setDone(true);else setIdx(i=>i+1);};
  if(cards.length<4)return <div className="text-center py-12 text-gray-400"><ClipboardList size={36} className="mx-auto mb-2 opacity-30" aria-hidden="true" /><p className="text-sm mt-1">Need at least 4 cards.</p><button type="button" aria-label="Back from quiz" onClick={onBack} className="mt-4 text-blue-500 text-sm">← Back</button></div>;
  if(done)return(
    <div className="flex flex-col gap-4 items-center text-center">
      <div className="bg-white rounded-2xl shadow border p-8 w-full"><p className="text-4xl mb-3">{score===cards.length?"🏆":score>cards.length/2?"😊":"💪"}</p><p className="font-extrabold text-2xl text-gray-800">{score}/{cards.length}</p><p className="text-sm text-gray-500">{Math.round(score/cards.length*100)}% correct</p></div>
      <button onClick={()=>{setIdx(0);setScore(0);setDone(false);setChosen(null);}} className="w-full bg-blue-600 text-white font-bold py-3 rounded-2xl text-sm">🔁 Retry</button>
      <button type="button" aria-label="Back from quiz results" onClick={onBack} className="w-full border border-gray-200 text-gray-500 py-3 rounded-2xl text-sm">← Back</button>
    </div>
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2"><button type="button" aria-label="Back from quiz" onClick={onBack} className="text-gray-400 hover:text-gray-700"><ArrowLeft size={20} aria-hidden="true" /></button><p className="font-bold text-gray-700 flex-1">Quiz &middot; {deck.name}</p><span className="text-xs text-gray-400">{idx+1}/{cards.length}</span></div>
      <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-purple-500 h-1.5 rounded-full" style={{width: ((idx/cards.length)*100) + "%"}}/></div>
      <div className="bg-white rounded-2xl shadow border p-6 text-center"><p className="text-xs text-gray-400 uppercase tracking-widest mb-2">What is the German for…</p><p className="text-2xl font-bold text-gray-800">{q.front}</p></div>
      <div className="grid grid-cols-2 gap-2">
        {opts.map(opt=>{let cls="bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50";if(chosen){if(opt.id===q.id)cls="bg-green-100 border-green-500 text-green-800";else if(opt.id===chosen)cls="bg-red-100 border-red-400 text-red-700";else cls="opacity-40 bg-white border-gray-200";}return <button key={opt.id} onClick={()=>pick(opt)} className={"rounded-xl border-2 p-3 text-sm font-semibold transition-all " + (cls)}><GBadge g={opt.gender}/><br/><span className="mt-1 block">{opt.back}</span></button>;})}
      </div>
      {chosen&&<button onClick={next} className="w-full bg-blue-600 text-white font-bold py-3 rounded-2xl text-sm">{idx+1>=cards.length?"See Results →":"Next →"}</button>}
    </div>
  );
}

// ── WRITING PRACTICE ──────────────────────────────────────────
export function WritingPractice({deck,onBack,addXP}) {
  const cards=deck.cards.filter(c=>c.back);
  const [idx,setIdx]=useState(0);const [input,setInput]=useState("");const [result,setResult]=useState(null);const [score,setScore]=useState(0);const ref=useRef();
  useEffect(()=>{setInput("");setResult(null);ref.current?.focus();},[idx]);
  const q=cards[idx%cards.length];
  const check=()=>{if(!input.trim())return;const ans=q.back.toLowerCase().trim();const usr=input.toLowerCase().trim();const ok=ans===usr||ans.replace(/^(der|die|das)\s/,"")===usr.replace(/^(der|die|das)\s/,"");setResult(ok);if(ok){setScore(s=>s+1);addXP(20);answerFeedback.correct();}else{answerFeedback.incorrect();}};
  const renderDiff=()=>q.back.split("").map((ch,i)=><span key={i} className={input[i]?.toLowerCase()===ch.toLowerCase()?"text-green-600 font-bold":"text-red-500 font-bold"}>{ch}</span>);
  if(!q)return null;
  return(
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2"><button type="button" aria-label="Back from writing practice" onClick={onBack} className="text-gray-400 hover:text-gray-700"><ArrowLeft size={20} aria-hidden="true" /></button><p className="font-bold text-gray-700 flex-1">Writing &middot; {deck.name}</p><span className="text-xs text-green-600 font-bold">{score} ✔</span></div>
      <div className="bg-white rounded-2xl shadow border p-6 text-center"><p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Translate to German</p><p className="text-2xl font-bold text-gray-800 mb-1">{q.front}</p><p className="text-xs text-gray-400 italic">{q.exampleEn}</p></div>
      <div className="flex gap-2"><input ref={ref} className={"flex-1 border-2 rounded-xl px-4 py-3 text-base focus:outline-none " + (result===null?"border-gray-200 focus:border-blue-400":result?"border-green-400":"border-red-400")} placeholder="Type the German word…" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(result===null?check():setIdx(i=>(i+1)%cards.length))} disabled={result!==null}/>{result===null&&<button onClick={check} className="bg-blue-600 text-white font-bold px-4 rounded-xl">Check</button>}</div>
      {result!==null&&<div className={"rounded-2xl p-4 " + (result?"bg-green-50 border border-green-200":"bg-red-50 border border-red-200")}><div className="flex items-center gap-2 mb-2"><span className="text-xl">{result?"✅":"❌"}</span><span className={"font-bold text-sm " + (result?"text-green-700":"text-red-700")}>{result?"Correct! +20 XP":"Not quite"}</span></div><div className="text-sm mb-1">{renderDiff()}</div><p className="text-xs text-gray-500 mt-1 italic">{q.exampleDe}</p><div className="flex gap-2 mt-3"><SpeakBtn text={q.back}/><button onClick={()=>setIdx(i=>(i+1)%cards.length)} className="ml-auto text-xs bg-blue-600 text-white px-4 py-1.5 rounded-xl font-bold">Next →</button></div></div>}
    </div>
  );
}

// ── SRS SESSION ───────────────────────────────────────────────
export function SRSSession({deck,onBack,onUpdateDeck,addXP,addStreak,addActivity}) {
  const due=deck.cards.filter(isDue);
  // Sort: weakest (lowest confidence) cards come first
  const [queue]=useState(()=>[...due].sort((a,b)=>((a.confidenceScore??70)-(b.confidenceScore??70))));
  const [idx,setIdx]=useState(0);const [scores,setScores]=useState({0:0,1:0,2:0,3:0});const [done,setDone]=useState(false);const [sessionXP,setSessionXP]=useState(0);
  const setNote=(cid,note)=>onUpdateDeck({...deck,cards:deck.cards.map(c=>c.id===cid?{...c,note}:c)});
  const handleRate=(r)=>{const card=queue[idx];const updated=sm2(card,r);onUpdateDeck({...deck,cards:deck.cards.map(c=>c.id===card.id?updated:c)});const xp=xpFor(r);addXP(xp);addActivity?.(1);setSessionXP(s=>s+xp);setScores(s=>({...s,[r]:s[r]+1}));if(idx+1>=queue.length){setDone(true);addStreak();}else setIdx(i=>i+1);};
  const total=Object.values(scores).reduce((a,b)=>a+b,0);
  const studyTitle=`${deck.name} study session`;
  const studyId="dh-study-title";
  const renderStudyHeader=(meta)=><div className="dh-study-header">
    <button type="button" aria-label="Exit study" onClick={onBack} className="dh-study-back">← <span>Exit</span></button>
    <div className="dh-study-header-copy"><h2 id={studyId}>{studyTitle}</h2><p>{meta}</p></div>
    {sessionXP>0&&<span className="dh-study-xp">+{sessionXP} XP</span>}
  </div>;
  if(queue.length===0)return(<section className="dh-study" aria-labelledby={studyId}>{renderStudyHeader("No cards due") }<div className="dh-study-state" role="status"><p className="dh-study-state-kicker">Ready when you are</p><h3>All caught up</h3><p>No cards are due right now.</p></div><button type="button" onClick={onBack} className="dh-study-secondary-action">Back to library</button></section>);
  if(done)return(<section className="dh-study" aria-labelledby={studyId}>{renderStudyHeader("Session complete") }<div className="dh-study-state dh-study-complete" role="status"><p className="dh-study-state-kicker">Session complete</p><h3>Good work.</h3><p>{total} {total===1?"card":"cards"} reviewed · <strong>+{sessionXP} XP</strong></p></div><div className="dh-study-results" aria-label="Study results"><p>Review results</p><div className="dh-study-result-grid">{[{k:0,l:"Again",c:"again"},{k:1,l:"Hard",c:"hard"},{k:2,l:"Good",c:"good"},{k:3,l:"Easy",c:"easy"}].map(x=><div key={x.k} className={"dh-study-result dh-study-result-"+x.c}><strong>{scores[x.k]}</strong><span>{x.l}</span></div>)}</div></div><button type="button" onClick={onBack} className="dh-study-secondary-action">Back to library</button></section>);
  const card=queue[idx];
  const progress=Math.round(((idx+1)/queue.length)*100);
  return(<section className="dh-study" aria-labelledby={studyId}>{renderStudyHeader(`${idx+1} of ${queue.length} cards`) }<div className="dh-study-progress-row"><span>Progress</span><span>{progress}%</span></div><div className="dh-study-progress" role="progressbar" aria-label="Study progress" aria-valuemin="0" aria-valuemax={queue.length} aria-valuenow={idx+1}><span style={{width:progress+"%"}}/></div><div className="dh-study-stage"><Flashcard card={card} onRate={handleRate} setNote={setNote}/></div></section>);
}

// ── CARD MODAL ────────────────────────────────────────────────
export function CardModal({card,onSave,onClose}) {
  const [f,setF]=useState(card||{front:"",back:"",gender:"der",plural:"",exampleDe:"",exampleEn:"",note:""});
  const { dialogRef } = useDialogA11y({ onClose });
  return(
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="card-dialog-title" className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <h3 id="card-dialog-title" className="font-bold text-gray-800 mb-4">{card?"✏️ Edit Card":"➕ New Card"}</h3>
        {[["English","front"],["German (with article)","back"],["Plural","plural"],["Example (DE)","exampleDe"],["Example (EN)","exampleEn"],["Mnemonic note","note"]].map(([label,key])=>(
          <div key={key} className="mb-3"><label className="text-xs text-gray-500 font-semibold uppercase" htmlFor={`card-${key}`}>{label}</label><input id={`card-${key}`} data-dialog-initial-focus={key==="front"?"true":undefined} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-300" value={f[key]||""} onChange={e=>setF(p=>({...p,[key]:e.target.value}))}/></div>
        ))}
        <div className="mb-4"><label className="text-xs text-gray-500 font-semibold uppercase">Gender</label><div className="flex gap-2 mt-1">{["der","die","das","verb"].map(g=><button key={g} onClick={()=>setF(p=>({...p,gender:g}))} className={"flex-1 py-1.5 rounded-lg text-xs font-bold border " + (f.gender===g?GS[g].badge+" border-transparent":"bg-gray-100 text-gray-500 border-gray-200")}>{g}</button>)}</div></div>
        <div className="flex gap-2"><button type="button" aria-label="Close card dialog" onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500">Cancel</button><button type="button" onClick={()=>{if(f.front&&f.back)onSave(f);}} className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm">Save</button></div>
      </div>
    </div>
  );
}

// ── GRAMMAR PANEL ─────────────────────────────────────────────
function GrammarPanel({level}) {
  const [open,setOpen]=useState(null);
  return(
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <p className="flex items-center gap-2 font-bold text-gray-700 text-sm uppercase tracking-widest"><BookOpen size={14} aria-hidden="true" /> Grammar Reference &middot; {level}</p>
          <p className="text-xs text-gray-400 mt-1">{LEVELS[level]?.label}</p>
        </div>
        {(GRAMMAR[level]||[]).map((r,i)=>(
          <div key={i} className="border-t border-gray-100">
            <button onClick={()=>setOpen(open===i?null:i)} className="w-full text-left px-4 py-3 flex justify-between items-center hover:bg-gray-50">
              <span className="text-sm font-semibold text-gray-700">{r.title}</span>
              {open===i ? <ChevronUp size={16} className="text-gray-400" aria-hidden="true" /> : <ChevronDown size={16} className="text-gray-400" aria-hidden="true" />}
            </button>
            {open===i&&<div className="px-4 pb-3"><pre className="text-xs text-gray-600 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap font-mono leading-relaxed">{r.content}</pre></div>}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(LEVELS).map(([l,v])=>(
          <div key={l} className={"rounded-xl p-3 border " + (l===level?v.border+" "+v.color:"border-gray-100 bg-white")}>
            <p className="font-bold text-sm">{l}</p>
            <p className="text-xs opacity-70 mt-0.5">{v.label.split("–")[1].trim()}</p>
            <p className="text-xs mt-1 opacity-60">{(GRAMMAR[l]||[]).length} topics</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── DECK DETAIL ───────────────────────────────────────────────
// ── LIBRARY ───────────────────────────────────────────────────
function Library({library,setLibrary,addXP,addStreak,addActivity,user,setUser, setLevel, onFocusedModeChange}) {
  const [openId,setOpenId]=useState(null);

  useEffect(() => {
    if (openId && setLevel) {
      const activeDeck = library.find(d => d.id === openId);
      if (activeDeck?.level) {
        setLevel(activeDeck.level);
      }
    }
  }, [openId, library, setLevel]);
  const [confirmDel,setConfirmDel]=useState(null);
  const [editId,setEditId]=useState(null);
  const [newName,setNewName]=useState("");
  const [importModal,setImportModal]=useState(false);
  const [importCode,setImportCode]=useState("");
  const [importErr,setImportErr]=useState("");
  const [importing,setImporting]=useState(false);
  const { dialogRef: importDialogRef } = useDialogA11y({ open: importModal, onClose: ()=>setImportModal(false) });
  const { dialogRef: deleteDialogRef } = useDialogA11y({ open: Boolean(confirmDel), onClose: ()=>setConfirmDel(null) });

  const openDeck=library.find(d=>d.id===openId);
  const addDeck = () => { const d = { id: uid(), name: "New Deck " + (library.length + 1), level: "A1", cards: [], created: Date.now() }; setLibrary(l => [...l, d]); setOpenId(d.id); };
  const delDeck=(id)=>{setLibrary(l=>l.filter(d=>d.id!==id));setConfirmDel(null);if(openId===id)setOpenId(null);};
  const changeLevel=(id,lv)=>setLibrary(l=>l.map(d=>d.id===id?{...d,level:lv}:d));
  const importDeck=async ()=>{
    if(!importCode.trim()) return;
    setImporting(true);setImportErr("");
    const code = importCode.trim().toUpperCase();
    const d = await DB.downloadSharedDeck(code);
    if(d && d.cards) {
      setLibrary(l=>[...l,{id:uid(),name:d.name||"Imported Deck",level:d.level||"A1",cards:d.cards.map(c=>({...c,id:uid()})),created:Date.now()}]);
      setImportModal(false);setImportCode("");setImportErr("");
    } else {
      setImportErr("Deck not found. Please check the code.");
    }
    setImporting(false);
  };

  if(openDeck)return <DeckDetail deck={openDeck} setLibrary={setLibrary} onBack={()=>{setOpenId(null);onFocusedModeChange?.(false);}} onFocusedModeChange={onFocusedModeChange} addXP={addXP} addStreak={addStreak} user={user} setUser={setUser} deps={{ uid, today, isWeak, isDue, DB, generateAIFlashcards, generateAITutorResponse, CardModal, SRSSession, QuizMode, WritingPractice, ListeningQuiz, addActivity, publishPublicDeck: DB.publishPublicDeck.bind(DB) }}/>;

  return(
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-extrabold text-gray-800 text-lg"><LibraryIcon size={18} aria-hidden="true" /> My Library</h2>
        <div className="flex gap-2">
          <button onClick={()=>setImportModal(true)} className="flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-bold px-3 py-2 rounded-xl hover:bg-gray-200"><Download size={13} aria-hidden="true" /> Import</button>
          <button onClick={addDeck} className="bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-blue-700"><Plus size={13} className="inline mr-0.5" aria-hidden="true" /> New Deck</button>
        </div>
      </div>

      {library.length===0&&<div className="text-center py-12 text-gray-400"><LibraryIcon size={40} className="mx-auto mb-3 opacity-30" aria-hidden="true" /><p className="text-sm">No decks yet. Create your first deck!</p></div>}

      <div className="dh-library-grid">
        {library.map(deck=>{
          const dueCount=deck.cards.filter(isDue).length;
          const total=deck.cards.length;
          const mastery=total>0?Math.round(deck.cards.filter(c=>c.interval>=21).length/total*100):0;
          const levelCls = LEVELS[deck.level]?.color || "bg-gray-100 text-gray-500";
          const state = dueCount>0 ? "due" : mastery>0 ? "mastered" : "fresh";
          return(
            <div key={deck.id} className={`dh-deck-card dh-deck-card--${state}`}>
              {/* Header: level badge | title + meta | icon actions */}
              <div className="dh-deck-card-header">
                <div className={`dh-deck-level-badge ${levelCls}`}>{deck.level}</div>
                <div className="dh-deck-card-title-block">
                  {editId===deck.id
                    ? <input autoFocus className="dh-deck-name-input" value={newName}
                        onChange={e=>setNewName(e.target.value)}
                        onBlur={()=>{setLibrary(l=>l.map(d=>d.id===deck.id?{...d,name:newName||d.name}:d));setEditId(null);}}
                        onKeyDown={e=>e.key==="Enter"&&(setLibrary(l=>l.map(d=>d.id===deck.id?{...d,name:newName||d.name}:d)),setEditId(null))}/>
                    : <p className="dh-deck-name">{deck.name}</p>}
                  <div className="dh-deck-meta">
                    <span>{total} {total===1?"card":"cards"}</span>
                    {mastery>0 && <><span className="dh-deck-meta-dot">·</span><span className="dh-deck-mastered-badge">{mastery}% mastered</span></>}
                    {mastery===0 && total>0 && <><span className="dh-deck-meta-dot">·</span><span className="dh-deck-new-badge">New</span></>}
                  </div>
                </div>
                <div className="dh-deck-card-actions">
                  <button type="button" aria-label={`Edit ${deck.name}`}
                    onClick={()=>{setEditId(deck.id);setNewName(deck.name);}}
                    className="dh-deck-icon-btn">
                    <Pencil size={13} aria-hidden="true"/>
                  </button>
                  <button type="button" aria-label={`Delete ${deck.name}`}
                    onClick={()=>setConfirmDel(deck.id)}
                    className="dh-deck-icon-btn dh-deck-icon-btn-danger">
                    <Trash2 size={13} aria-hidden="true"/>
                  </button>
                </div>
              </div>

              {/* Mastery progress — green only, shown when there's something to show */}
              <div className="dh-deck-progress-wrap">
                <div className="dh-deck-progress-track">
                  <div className="dh-deck-progress-fill" style={{width: mastery+"%"}}/>
                </div>
              </div>

              {/* CTA footer — changes text when due cards exist */}
              <button type="button" onClick={()=>setOpenId(deck.id)} className="dh-deck-open-btn">
                {dueCount>0
                  ? <><span>Study now</span><span className="dh-deck-open-due-count">{dueCount} due</span></>
                  : <span>Open deck</span>}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          );
        })}
      </div>

      {importModal&&(
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={()=>setImportModal(false)}>
          <div ref={importDialogRef} role="dialog" aria-modal="true" aria-labelledby="import-dialog-title" className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full" onClick={e=>e.stopPropagation()}>
            <h3 id="import-dialog-title" className="flex items-center gap-2 font-bold text-gray-800 mb-3"><Download size={16} aria-hidden="true" /> Import Deck</h3>
            <p className="text-xs text-gray-400 mb-3">Paste a shared deck code below</p>
            <input data-dialog-initial-focus="true" aria-label="Shared deck code" className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base font-bold text-center uppercase tracking-widest focus:outline-none" placeholder="e.g. X9K2A1" value={importCode} onChange={e=>setImportCode(e.target.value)}/>
            {importErr&&<p role="alert" className="text-xs text-red-500 mt-1 text-center font-bold">{importErr}</p>}
            <div className="flex gap-2 mt-3">
              <button type="button" aria-label="Close import dialog" onClick={()=>setImportModal(false)} className="flex-1 py-2 border rounded-xl text-sm text-gray-500">Cancel</button>
              <button onClick={importDeck} disabled={importing} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">{importing?"Importing...":"Import"}</button>
            </div>
          </div>
        </div>
      )}
      {confirmDel&&(
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={()=>setConfirmDel(null)}>
          <div ref={deleteDialogRef} role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title" className="bg-white rounded-2xl p-6 shadow-2xl max-w-xs w-full text-center" onClick={e=>e.stopPropagation()}>
            <h3 id="delete-dialog-title" className="sr-only">Delete deck confirmation</h3>
            <Trash2 size={28} className="mx-auto mb-2 text-red-400" aria-hidden="true" /><p className="font-bold text-gray-800 mb-1">Delete this deck?</p><p className="text-xs text-gray-400 mb-4">This cannot be undone.</p>
            <div className="flex gap-2"><button type="button" data-dialog-initial-focus="true" onClick={()=>setConfirmDel(null)} className="flex-1 py-2 rounded-xl border text-sm text-gray-500">Cancel</button><button type="button" onClick={()=>delDeck(confirmDel)} className="flex-1 py-2 rounded-xl bg-red-500 text-white font-bold text-sm">Delete</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── GENERATE PANEL ────────────────────────────────────────────
function GeneratePanel({level,library,setLibrary,user,setUser}) {
  const [prompt,setPrompt]=useState("");const [loading,setLoading]=useState(false);const [error,setError]=useState("");const [preview,setPreview]=useState([]);const [target,setTarget]=useState("__new__");const [newName,setNewName]=useState("");const [saved,setSaved]=useState(false);const [importMode,setImportMode]=useState(false);const [importText,setImportText]=useState("");

  const checkRateLimit = () => {
    if(!user) return false;
    const td = today();
    const used = user.lastGenDate === td ? (user.dailyGens || 0) : 0;
    if(used >= 5) {
      setError("⏳ Daily limit reached (5/5). Come back tomorrow!");
      return false;
    }
    return true;
  };

  const consumeRateLimit = async () => {
    if(!user) return;
    const td = today();
    const used = user.lastGenDate === td ? (user.dailyGens || 0) : 0;
    const nextUser = { ...user, lastGenDate: td, dailyGens: used + 1 };
    setUser(nextUser);
    await DB.setUser(user.uid, { lastGenDate: td, dailyGens: used + 1 });
  };



  const generate=async()=>{
    if(!prompt.trim())return;
    if(!checkRateLimit())return;
    setLoading(true);setError("");setPreview([]);setSaved(false);
    try{
      const all=await generateAIFlashcards(prompt, level)||[];
      if(all.length>0) {
        setPreview(all.map(c=>({...c,id:uid()})));
        consumeRateLimit();
      }
      else setError("No cards parsed. Try a simpler prompt.");
    }catch(e){setError(getAIUserMessage(e));}
    setLoading(false);
  };

  const importCards=async()=>{
    if(!importText.trim())return;
    if(!checkRateLimit())return;
    setLoading(true);setError("");setSaved(false);
    const p=`Convert this word list into valid, accurate German flashcards at ${level} level:\n${importText}`;
    try{
      const c=await generateAIFlashcards(p, level);
      if(Array.isArray(c)&&c.length>0){
        setPreview(c.map(x=>({...x,id:uid()})));
        setImportMode(false);
        consumeRateLimit();
      }else setError("Could not parse import.");
    }catch(e){setError(getAIUserMessage(e));}
    setLoading(false);
  };

  const saveCards=()=>{if(!preview.length)return;if(target==="__new__"){const name=newName.trim()||`Generated – ${level} – ${new Date().toLocaleDateString()}`;setLibrary(l=>[...l,{id:uid(),name,level,cards:preview,created:Date.now()}]);}else{setLibrary(l=>l.map(d=>d.id===target?{...d,cards:[...d.cards,...preview]}:d));}setSaved(true);};

  return(
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest"><Brain size={13} aria-hidden="true" /> AI Generator &middot; {level}</p>
          <div className="flex gap-2 items-center">
            {user && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">{(user.lastGenDate===today()?(user.dailyGens||0):0)}/5 Used</span>}
            <button onClick={()=>setImportMode(m=>!m)} className={"flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-semibold border " + (importMode?"bg-blue-100 border-blue-300 text-blue-600":"bg-gray-100 border-gray-200 text-gray-500")}><ClipboardList size={12} aria-hidden="true" /> Import list</button>
          </div>
        </div>
        {importMode?(
          <><textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" rows={4} placeholder={"Paste words, one per line:\nApfel\nHaus\ngehen"} value={importText} onChange={e=>setImportText(e.target.value)}/><button onClick={importCards} disabled={loading} className="mt-2 w-full bg-blue-600 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50">{loading?"Generating…":"Convert to flashcards"}</button></>
        ):(
          <><div className="flex gap-2 mb-2"><input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder={`e.g. "10 ${level} food vocabulary cards"`} value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&generate()}/><button onClick={generate} disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm">{loading?"…":"Go"}</button></div>
          <div className="flex flex-wrap gap-1">{[`10 ${level} noun cards`,`${level} separable verbs`,`5 ${level} adjective cards`,`${level} weather vocab`].map(ex=><button key={ex} onClick={()=>setPrompt(ex)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg px-2 py-1">{ex}</button>)}</div></>
        )}
        {loading&&<p role="status" aria-live="polite" className="sr-only">Generating flashcards…</p>}
        {error&&<p role="alert" className="text-xs mt-2 text-red-500 font-bold">{error}</p>}
      </div>
      {preview.length>0&&(
        <div className="bg-white rounded-2xl shadow border overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between"><p className="font-bold text-gray-700 text-sm">Preview &middot; {preview.length} cards</p>{saved&&<span className="flex items-center gap-1 text-xs text-green-600 font-bold"><Check size={13} aria-hidden="true" /> Saved</span>}</div>
          <div className="divide-y divide-gray-50 max-h-52 overflow-y-auto">{preview.map(c=><div key={c.id} className="flex items-center gap-2 px-4 py-2"><GBadge g={c.gender}/><span className="text-sm font-medium text-gray-700">{c.back}</span><span className="text-xs text-gray-400">&middot; {c.front}</span><div className="ml-auto"><SpeakBtn text={c.back} small/></div></div>)}</div>
          {!saved&&<div className="p-4 border-t flex flex-col gap-2">
            <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" value={target} onChange={e=>setTarget(e.target.value)}><option value="__new__">+ Create new deck</option>{library.map(d=><option key={d.id} value={d.id}>{d.name} ({d.cards.length})</option>)}</select>
            {target==="__new__"&&<input className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" placeholder="New deck name (optional)" value={newName} onChange={e=>setNewName(e.target.value)}/>}
            <button onClick={saveCards} className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-sm"><Save size={15} aria-hidden="true" /> Save {preview.length} Cards</button>
          </div>}
        </div>
      )}
    </div>
  );
}

// ── LEADERBOARD ───────────────────────────────────────────────
function Leaderboard({currentUser}) {
  const [board,setBoard]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{DB.getLeaderboard().then(d=>{setBoard(d);setLoading(false);});},[]);
  const medals=["🥇","🥈","🥉"];
  return(
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl shadow border overflow-hidden">
        <div className="p-4 border-b"><p className="flex items-center gap-2 font-bold text-gray-700 text-sm uppercase tracking-widest"><Trophy size={14} aria-hidden="true" /> Global Leaderboard</p><p className="text-xs text-gray-400 mt-0.5">Top learners by XP</p></div>
        {loading?<div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
        :<div className="divide-y divide-gray-50">
          {board.map((u,i)=>(
            <div key={u.uid} className={"flex items-center gap-3 px-4 py-3 " + (u.uid===currentUser?.uid?"bg-blue-50":"")}>
              <span className="text-lg w-6 text-center">{i<3?medals[i]:<span className="text-sm font-bold text-gray-400">#{i+1}</span>}</span>
              <span className="text-2xl">{u.avatar||"😊"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{u.name}{u.uid===currentUser?.uid?" (you)":""}</p>
                <p className="text-xs text-gray-400">{u.xp} XP</p>
              </div>
              <span className="text-xl">{u.badge||"🌱"}</span>
            </div>
          ))}
        </div>}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
        <p className="font-bold mb-1">Tip</p>
        <p className="text-xs">Study daily and rate cards "Easy" to earn more XP and climb the leaderboard!</p>
      </div>
    </div>
  );
}

// ── SUPPORT CARD ──────────────────────────────────────────────
function SupportCard() {
  const [toast, setToast] = useState(""); // "redirecting" | "thankyou" | ""

  const handleSupport = () => {
    setToast("redirecting");
    setTimeout(() => {
      window.open(SUPPORT_URL, "_blank", "noopener,noreferrer");
      setToast("thankyou");
      setTimeout(() => setToast(""), 3500);
    }, 250);
  };

  return (
    <div id="support-section" className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border-b border-gray-100 px-5 py-4">
        <p className="font-extrabold text-gray-800 text-base">☕ Support Deutsch Hub</p>
        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
          Deutsch Hub is built to help students learn German faster and more effectively.<br/>
          If this platform helps you, you can support its growth ☕
        </p>
      </div>

      {/* Amount guide */}
      <div className="px-5 pt-4">
        <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex flex-col gap-1.5">
          {[
            { price: "₹20", label: "Buy a coffee" },
            { price: "₹50", label: "Support development" },
            { price: "₹100", label: "Power supporter" },
          ].map(({ price, label }) => (
            <div key={price} className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-600 w-10">{price}</span>
              <span className="text-xs text-gray-500">→ {label}</span>
            </div>
          ))}
          <p className="text-[11px] text-gray-400 mt-1">Choose any amount you feel comfortable with.</p>
        </div>
      </div>

      {/* Single CTA button */}
      <div className="px-5 py-4">
        <button
          onClick={handleSupport}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.97] hover:scale-[1.01]"
        >
          ☕ Support Deutsch Hub
        </button>
      </div>

      {/* Toast feedback */}
      {toast === "redirecting" && (
        <div className="mx-5 mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <span className="text-base">🔄</span>
          <p className="text-xs font-semibold text-blue-700">Redirecting to secure payment… ☕</p>
        </div>
      )}
      {toast === "thankyou" && (
        <div className="mx-5 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <span className="text-base">❤️</span>
          <p className="text-xs font-semibold text-emerald-700">Thank you for supporting Deutsch Hub ❤️</p>
        </div>
      )}
    </div>
  );
}


// ── STATS VIEW ────────────────────────────────────────────────
function StatsView({library,xp,streak,goal,setGoal,dailyDone,history,user,onSignOut,installPrompt,setInstallPrompt,themePreference,setThemePreference}) {
  const [soundOn, setSoundOn] = useState(() => answerFeedback.isEnabled());
  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      console.log("App installed");
    }
    setInstallPrompt(null);
  };

  const total=library.reduce((a,d)=>a+d.cards.length,0);
  const mastered=library.reduce((a,d)=>a+d.cards.filter(c=>c.interval>=21).length,0);
  const due=library.reduce((a,d)=>a+d.cards.filter(isDue).length,0);
    const badge=getBadge(xp);
  const nextBadge=BADGES.find(b=>b.xp>xp)||badge;
  const pct=nextBadge.xp===badge.xp?100:Math.round((xp-badge.xp)/(nextBadge.xp-badge.xp)*100);
  const goalPct=Math.min(100,Math.round((dailyDone/Math.max(1,goal))*100));

  return(
    <div className="flex flex-col gap-4">
      {/* Profile */}
      <div className="bg-white rounded-2xl shadow border p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-2xl font-bold text-white">{user?.avatar||user?.name?.[0]||"?"}</div>
          <div className="flex-1">
            <p className="font-extrabold text-gray-800 text-lg">{user?.name||"Learner"}</p>
            <p className="text-xs text-gray-400">{user?.email||"Demo Mode"}</p>
            <div className="flex items-center gap-1 mt-1"><span className={"text-sm " + (badge.color)}>{badge.icon}</span><span className="text-xs font-bold text-gray-600">{badge.label}</span></div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <button onClick={onSignOut} className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2 py-1.5 rounded-lg">Sign out</button>
            <button
              onClick={() => document.getElementById('support-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="text-[11px] font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg transition-colors"
            >☕ Support
            </button>
            {installPrompt && (
              <button
                onClick={handleInstall}
                className="text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-lg transition-colors"
              >📱 Install App
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mb-1"><span className="text-xs text-gray-500">{xp} XP</span><span className="text-xs text-gray-500">{nextBadge.xp>xp?`${nextBadge.xp-xp} to ${nextBadge.icon}`:"Max! 🌟"}</span></div>
        <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-purple-500 h-2 rounded-full transition-all" style={{width:`${pct}%`}}/></div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <label htmlFor="theme-preference" className="text-xs font-semibold text-gray-500">Theme</label>
          <select id="theme-preference" aria-label="Theme preference" value={themePreference} onChange={e=>setThemePreference(e.target.value)} className="border border-gray-200 bg-white text-gray-700 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-300">
            <option value={THEME_PREFERENCES.SYSTEM}>System</option>
            <option value={THEME_PREFERENCES.LIGHT}>Light</option>
            <option value={THEME_PREFERENCES.DARK}>Dark</option>
          </select>
        </div>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="sound-feedback" className="text-xs font-semibold text-gray-500">Answer sounds</label>
          <button
            id="sound-feedback"
            role="switch"
            aria-checked={soundOn}
            onClick={() => { const next = !soundOn; setSoundOn(next); answerFeedback.setEnabled(next); }}
            className={"relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 " + (soundOn ? "bg-blue-600" : "bg-gray-300")}
          >
            <span className={"inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform " + (soundOn ? "translate-x-4" : "translate-x-0.5")} />
          </button>
        </div>
      </div>

      {/* Streak Calendar */}
      <div className="bg-white rounded-2xl shadow border p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">🔥 Streak &middot; {streak} days</p>
          <span className="text-2xl font-extrabold text-orange-500">{streak}</span>
        </div>
        <StreakCalendar history={history}/>
      </div>

      {/* Daily goal */}
      <div className="bg-white rounded-2xl shadow border p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">🎯 Daily Goal</p>
          <span className="text-xs font-bold text-blue-600">{dailyDone}/{goal} today {goalPct>=100?"✅":""}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-3"><div className={"h-2 rounded-full transition-all " + (goalPct>=100?"bg-green-500":"bg-blue-500")} style={{width:goalPct+"%"}}/></div>
        <div className="flex gap-2 flex-wrap">{[5,10,20,30,50,100].map(g=><button key={g} onClick={()=>setGoal(g)} className={"px-3 py-1.5 rounded-xl text-xs font-bold border transition-all " + (goal===g?"bg-blue-600 text-white border-blue-600":"bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200")}>{g}</button>)}</div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[{v:total,l:"Total cards",c:"text-blue-600"},{v:mastered,l:"Mastered",c:"text-green-600"},{v:due,l:"Due now",c:"text-red-500"},{v:library.length,l:"Decks",c:"text-purple-600"}].map(x=>(
          <div key={x.l} className="bg-white rounded-2xl shadow border p-4 text-center"><p className={"text-3xl font-extrabold " + (x.c)}>{x.v}</p><p className="text-xs text-gray-400 mt-1">{x.l}</p></div>
        ))}
      </div>

      {/* Level breakdown */}
      <div className="bg-white rounded-2xl shadow border p-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Cards by Level</p>
        {Object.keys(LEVELS).map(l=>{const cnt=library.filter(d=>d.level===l).reduce((a,d)=>a+d.cards.length,0);return(
          <div key={l} className="mb-3"><div className="flex justify-between mb-1"><span className={"text-xs font-bold px-2 py-0.5 rounded-full " + (LEVELS[l].color)}>{l}</span><span className="text-xs text-gray-400">{cnt} cards</span></div><div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{width:total?(cnt/total)*100+"%":"0%"}}/></div></div>
        );})}
      </div>

      {/* Support Card */}
      <SupportCard />
    </div>
  );
}

// ── AI TUTOR ──────────────────────────────────────────────────

export function AITutor({deck, onClose}) {
  const [mode, setMode] = useState(null); // 'explain' | 'sentences' | 'correct'
  const [selectedCard, setSelectedCard] = useState(deck?.cards[0] || null);
  const [userInput, setUserInput] = useState("");
  const [response, setResponse] = useState("");
  const [correctionResult, setCorrectionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h3 className="font-extrabold text-gray-800">🤖 AI Tutor</h3>
            <p className="text-xs text-gray-400 mt-0.5">Powered by Groq</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>

        <div className="p-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Select Word</p>
          <select
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
                disabled={loading}
                className={"flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-bold transition-all disabled:opacity-40 " + (mode===btn.key ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 bg-white text-gray-600 hover:border-purple-300")}>
                <span className="text-lg">{btn.icon}</span>{btn.label}
              </button>
            ))}
          </div>

          {mode === "correct" && (
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="Write a German sentence to check…"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => e.key==="Enter" && run("correct")}
              />
              <button onClick={() => run("correct")} disabled={loading || !userInput.trim()}
                className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-purple-700 transition-colors">
                Check
              </button>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8 gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay:"0ms"}}/>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay:"150ms"}}/>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay:"300ms"}}/>
            </div>
          )}

          {error && <p className="text-xs text-red-500 font-bold text-center">{error}</p>}

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


// ── DAILY MISSIONS ────────────────────────────────────────────
const MISSION_DEFS = [
  { id:"reviews",  Icon: Brain,     label:"Complete 10 reviews",  target:10, xpReward:50 },
  { id:"learning", Icon: BookOpen,  label:"Learn 5 new cards",    target:5,  xpReward:30 },
  { id:"streak",   icon:"🔥",       label:"Study 1 deck today",   target:1,  xpReward:20 },
];

function DailyMissions({missions, onClaim, dailyDone, streak}) {
  const progress = {
    reviews:  Math.min(MISSION_DEFS[0].target, dailyDone),
    learning: Math.min(MISSION_DEFS[1].target, dailyDone),
    streak:   streak > 0 ? 1 : 0,
  };

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest"><Target size={13} aria-hidden="true" /> Daily Missions</p>
        <span className="text-xs text-gray-400">{missions.filter(m=>m.claimed).length}/{MISSION_DEFS.length} done</span>
      </div>
      <div className="flex flex-col gap-2">
        {MISSION_DEFS.map(def => {
          const missionState = missions.find(m=>m.id===def.id) || {id:def.id, claimed:false};
          const prog = progress[def.id] || 0;
          const complete = prog >= def.target;
          const canClaim = complete && !missionState.claimed;
          const pct = Math.round((prog / def.target) * 100);
          return (
            <div key={def.id} className={"rounded-xl p-3 border transition-all " + (missionState.claimed ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100")}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {def.Icon ? <def.Icon size={15} className="text-gray-500" aria-hidden="true" /> : <span className="text-base" aria-hidden="true">{def.icon}</span>}
                  <p className={"text-xs font-semibold " + (missionState.claimed ? "text-green-700" : "text-gray-700")}>{def.label}</p>
                </div>
                {missionState.claimed ? (
                  <span className="flex items-center gap-0.5 text-xs font-bold text-green-600"><Check size={13} aria-hidden="true" /> Claimed</span>
                ) : canClaim ? (
                  <button onClick={() => onClaim(def)} className="text-xs font-bold bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded-lg transition-colors">
                    +{def.xpReward} XP
                  </button>
                ) : (
                  <span className="text-xs text-gray-400 font-bold">{prog}/{def.target}</span>
                )}
              </div>
              <div className="w-full rounded-full h-1" style={{background: 'var(--dh-color-surface-subtle)'}}>
                <div
                  className={"h-1 rounded-full transition-all " + (missionState.claimed ? "bg-green-400" : "bg-blue-400")}
                  style={{width: (missionState.claimed ? 100 : pct) + "%"}}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── HOME TAB ──────────────────────────────────────────────────

// ── LEARNING PATH SETUP MODAL ────────────────────────────────
const LEVEL_ORDER = ["A1","A2","B1","B2","C1","C2"];
function LearningPathModal({user, currentGoal, onSave, onClose}) {
  const [targetLevel, setTargetLevel] = useState(currentGoal?.targetLevel || "B1");
  const [timeframe, setTimeframe] = useState(currentGoal?.timeframe || 60);
  const [saving, setSaving] = useState(false);
  const { dialogRef } = useDialogA11y({ onClose });

  const dailyCardTarget = Math.max(5, Math.round(timeframe < 30 ? 20 : timeframe < 60 ? 15 : 10));
  const dailyRevTarget  = Math.max(10, dailyCardTarget * 2);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const goalData = {
      targetLevel, timeframe,
      dailyCardTarget, dailyRevTarget,
      startDate: currentGoal?.startDate || today(),
      completedDays: currentGoal?.completedDays || [],
      uid: user.uid
    };
    await DB.setUserGoal(user.uid, goalData);
    onSave(goalData);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="learning-goal-dialog-title" className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 id="learning-goal-dialog-title" className="font-extrabold text-gray-800 text-base">🎯 Set Learning Goal</h3>
          <button type="button" aria-label="Close learning goal dialog" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Target Level</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {LEVEL_ORDER.map(l => (
            <button type="button" data-dialog-initial-focus={l===LEVEL_ORDER[0]?"true":undefined} key={l} onClick={() => setTargetLevel(l)}
              className={"py-2 rounded-xl text-sm font-bold border-2 transition-all " + (targetLevel===l ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-500 hover:border-blue-200")}>
              {l}
            </button>
          ))}
        </div>

        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Timeframe</p>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[30, 60, 90].map(t => (
            <button type="button" key={t} onClick={() => setTimeframe(t)}
              className={"py-2 rounded-xl text-sm font-bold border-2 transition-all " + (timeframe===t ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-white text-gray-500 hover:border-indigo-200")}>
              {t} days
            </button>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5 text-xs text-blue-700">
          <p className="font-bold mb-1">📋 Your Daily Targets</p>
          <p>• Learn <strong>{dailyCardTarget} new cards</strong> per day</p>
          <p>• Review <strong>{dailyRevTarget} cards</strong> per day</p>
          <p className="mt-1 opacity-70">Reach <strong>{targetLevel}</strong> in <strong>{timeframe} days</strong></p>
        </div>

        <button type="button" onClick={handleSave} disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 transition-colors">
          {saving ? "Saving…" : currentGoal ? "Update Goal" : "Start Learning Path"}
        </button>
      </div>
    </div>
  );
}

// ── GOAL PROGRESS CARD ────────────────────────────────────────
function GoalProgressCard({userGoal, dailyDone, onEdit}) {
  if (!userGoal) return (
    <button onClick={onEdit} className="w-full bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-4 text-left hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🎯</span>
        <div>
          <p className="font-bold text-gray-800 text-sm">Set a Learning Goal</p>
          <p className="text-xs text-gray-500 mt-0.5">Get a structured path to reach your target level</p>
        </div>
        <span className="ml-auto text-blue-500 font-bold text-sm">Set up →</span>
      </div>
    </button>
  );

  const { targetLevel, timeframe, startDate, dailyCardTarget, dailyRevTarget, completedDays = [] } = userGoal;
  const daysPassed = Math.max(0, Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000));
  const daysLeft = Math.max(0, timeframe - daysPassed);
  const overallPct = Math.min(100, Math.round((daysPassed / timeframe) * 100));
  const todayDone = dailyDone >= dailyCardTarget;
  const revPct = Math.min(100, Math.round((dailyDone / Math.max(1, dailyRevTarget)) * 100));

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <div>
            <p className="text-sm font-extrabold text-gray-800">Goal: {targetLevel} in {timeframe} days</p>
            <p className="text-xs text-gray-400">{daysLeft} days left &middot; Day {daysPassed + 1}</p>
          </div>
        </div>
        <button onClick={onEdit} className="text-xs text-blue-500 font-bold hover:text-blue-700">Edit</button>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Overall Progress</span><span className="font-bold text-blue-600">{overallPct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all" style={{width: overallPct + "%"}}/>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className={"rounded-xl p-2.5 border text-center " + (todayDone ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100")}>
          <p className={"text-lg font-extrabold " + (todayDone?"text-green-600":"text-gray-700")}>{dailyDone}/{dailyCardTarget}</p>
          <p className="text-[10px] text-gray-400">Cards today {todayDone?"✅":""}</p>
        </div>
        <div className={"rounded-xl p-2.5 border text-center " + (revPct>=100 ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100")}>
          <p className={"text-lg font-extrabold " + (revPct>=100?"text-green-600":"text-gray-700")}>{revPct}%</p>
          <p className="text-[10px] text-gray-400">Reviews done {revPct>=100?"✅":""}</p>
        </div>
      </div>
    </div>
  );
}

function HomeTab({library,addXP,setNav,user,xp,streak,dailyDone,userGoal,setUserGoal,missions,onClaimMission}) {
  const badge=getBadge(xp);
  const totalDue=library.reduce((a,d)=>a+d.cards.filter(isDue).length,0);
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Find the most-due deck for a targeted study prompt
  const topDueDeck = totalDue > 0
    ? [...library].sort((a,b)=>b.cards.filter(isDue).length-a.cards.filter(isDue).length)[0]
    : null;

  // Adaptive section order: when cards are due, promote the study prompt
  const hasDue = totalDue > 0;
  const hasDecks = library.length > 0;

  return(
    <div className="flex flex-col gap-4">

      {/* ── Hero band — rich gradient for premium feel ── */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-4 text-white">
        <p className="text-sm font-semibold opacity-80">Good {new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"}, {user?.name?.split(" ")[0]||"Learner"}! 👋</p>
        <div className="flex items-center gap-3 mt-1">
          <div><p className="text-2xl font-extrabold">{badge.icon} {badge.label}</p><p className="text-xs opacity-70">{xp} XP &middot; {streak} day streak 🔥</p></div>
        </div>
      </div>

      {/* ── No-decks CTA ── */}
      {!hasDecks && (
        <button onClick={()=>setNav("library")} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl text-sm transition-colors">
          + Create your first deck
        </button>
      )}

      {/* ── WOTD — daily ritual, chromatic surface ── */}
      <WordOfDay addXP={addXP}/>

      {/* ── Goal card ── */}
      <GoalProgressCard userGoal={userGoal} dailyDone={dailyDone} onEdit={()=>setShowGoalModal(true)}/>

      {/* ── Daily Missions ── */}
      <DailyMissions missions={missions} onClaim={onClaimMission} dailyDone={dailyDone} streak={streak}/>

      {/* ── Study prompt when cards are due — below missions, above quick nav ── */}
      {hasDue && topDueDeck && (
        <DueBanner library={library} onStudyAll={()=>setNav("library")} />
      )}

      {/* ── Quick navigation — flat, no gradients ── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {Icon: LibraryIcon, label:"My Library",   sub:`${library.length} deck${library.length===1?'':'s'}`, nav:"library"},
          {Icon: Brain,       label:"AI Generate",  sub:"Create cards with AI",    nav:"generate"},
          {Icon: BookOpen,    label:"Grammar",       sub:"Quick reference",         nav:"grammar"},
          {Icon: Trophy,      label:"Leaderboard",   sub:"See top learners",        nav:"leaderboard"},
        ].map(item=>(
          <button key={item.nav} onClick={()=>setNav(item.nav)} className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:bg-gray-50 hover:border-gray-300 transition-colors">
            <item.Icon size={20} className="text-gray-500 mb-2" aria-hidden="true" />
            <p className="font-bold text-gray-800 text-sm">{item.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
          </button>
        ))}
      </div>

      {library.length>0&&(
        <div className="bg-white rounded-2xl shadow border p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Recent Decks</p>
          <div className="flex flex-col gap-2">
            {library.slice(0,3).map(d=>{const due=d.cards.filter(isDue).length;return(
              <div key={d.id} className="flex items-center gap-3">
                <div className={"w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold " + (LEVELS[d.level]?.color)}>{d.level}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{d.name}</p><p className="text-xs text-gray-400">{d.cards.length} cards{due > 0 ? " · " + due + " due" : ""}</p></div>
                {due>0&&<span className="text-xs bg-red-100 text-red-600 font-bold px-1.5 rounded-full">{due}</span>}
              </div>
            );})}
          </div>
        </div>
      )}
      {showGoalModal && user && (
        <LearningPathModal user={user} currentGoal={userGoal} onSave={(g)=>{setUserGoal(g);setShowGoalModal(false);}} onClose={()=>setShowGoalModal(false)}/>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [authState,setAuthState]=useState("booting"); // booting|unauth|authenticating|profile_loading|profile_load_error|onboarding|app
  const [authError,setAuthError]=useState(null);
  const [profileError,setProfileError]=useState(null);
  const [firebaseUser,setFirebaseUser]=useState(null);
  const signOutInFlight = useRef(false);
  const [userGoal,setUserGoal]=useState(null);
  const [user,setUser]=useState(null);
  const [level,setLevel]=useState("A1");
  const [nav,setNav]=useState("home");
  const [library,setLibRaw]=useState([]);
  const [xp,setXp]=useState(0);
  const [streak,setStreak]=useState(0);
  const [lastDay,setLastDay]=useState("");
  const [dailyDone,setDailyDone]=useState(0);
  const [goal,setGoal]=useState(20);
  const [history,setHistory]=useState([]); // array of datestrings studied
  const [activityLog,setActivityLog]=useState({}); // {dateString: cardsReviewedCount}
  const [missions,setMissions]=useState([]); // daily mission states
  const [installPrompt, setInstallPrompt] = useState(null);
  const [focusedMode, setFocusedMode] = useState(false);
  const [themePreference,setThemePreference]=useState(()=>getStoredThemePreference());

  const loadAuthenticatedProfile = useCallback(async (fbUser) => {
    setAuthError(null);
    setProfileError(null);
    setAuthState("profile_loading");

    try {
      const profileResult = await DB.getUser(fbUser.uid);

      if (profileResult.status === PROFILE_STATES.READ_ERROR) {
        console.error("Unable to load the authenticated user profile", profileResult.error);
        setProfileError({ message: "We couldn't load your profile. Your data hasn't been changed. Try again." });
        setAuthState("profile_load_error");
        return;
      }

      if (profileResult.status === PROFILE_STATES.NOT_FOUND) {
        setUser({ uid: fbUser.uid, name: fbUser.displayName || "", email: fbUser.email, avatar: fbUser.displayName?.[0]?.toUpperCase() || "🧑" });
        setAuthState("onboarding");
        return;
      }

      const userData = profileResult.data;
      setUser(userData);
      setLevel(userData.level || "A1");
      setGoal(userData.goal || 20);
      setXp(userData.xp || 0);
      setStreak(userData.streak || 0);
      setHistory(userData.history || []);
      // Migration: if activityLog absent, seed from history[] with count=1
      if (userData.activityLog) {
        setActivityLog(userData.activityLog);
      } else if (userData.history?.length) {
        const migrated = {};
        (userData.history || []).forEach(d => { migrated[d] = migrated[d] ? migrated[d] + 1 : 1; });
        setActivityLog(migrated);
        DB.setUser(fbUser.uid, { activityLog: migrated }).catch(() => {});
      }
      const lib = await DB.getLibrary(fbUser.uid);
      setLibRaw(lib);
      const ug = await DB.getUserGoal(fbUser.uid);
      if (ug) setUserGoal(ug);
      const ms = await DB.getMissions(fbUser.uid);
      if (ms && ms.date === new Date().toDateString()) setMissions(ms.missions || []);
      else setMissions([]);
      setAuthState("app");
    } catch (error) {
      console.error("Unexpected authenticated profile load failure", error);
      setProfileError({ message: "We couldn't load your profile. Your data hasn't been changed. Try again." });
      setAuthState("profile_load_error");
    }
  }, []);

  useLayoutEffect(() => {
    const syncTheme = () => applyTheme(themePreference);
    syncTheme();

    if (themePreference !== THEME_PREFERENCES.SYSTEM || typeof window === "undefined" || !window.matchMedia) return undefined;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => syncTheme();
    if (mediaQuery.addEventListener) mediaQuery.addEventListener("change", handleSystemThemeChange);
    else mediaQuery.addListener?.(handleSystemThemeChange);
    return () => {
      if (mediaQuery.removeEventListener) mediaQuery.removeEventListener("change", handleSystemThemeChange);
      else mediaQuery.removeListener?.(handleSystemThemeChange);
    };
  }, [themePreference]);

  const handleThemePreference = (preference) => {
    const normalized = saveThemePreference(preference);
    setThemePreference(normalized);
  };

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(()=>{
    const unsub = authService.subscribeToAuthState(
      fbUser => {
        setFirebaseUser(fbUser);
        if (fbUser) {
          setNav("home");
          void loadAuthenticatedProfile(fbUser);
        } else {
          setUser(null); setLibRaw([]); setXp(0); setStreak(0); setHistory([]); setUserGoal(null); setMissions([]); setAuthError(null); setProfileError(null); setAuthState("unauth");
        }
      },
      error => {
        setFirebaseUser(null);
        setAuthError(error);
        setAuthState("auth_error");
      },
    );
    return unsub;
  },[loadAuthenticatedProfile]);
  
  const handleGoogle=async ()=>{
    if (authState === "authenticating") return;
    setAuthError(null);
    setAuthState("authenticating");
    try {
      await authService.signInWithGoogle();
    } catch (error) {
      setAuthError(normalizeAuthError(error));
      setAuthState("unauth");
    }
  };

  const handleCancelGoogle=()=>{
    if (authState !== "authenticating") return;
    authService.cancelGoogleSignIn();
    setAuthError(normalizeAuthError({ code: "auth/popup-closed-by-user" }));
    setAuthState("unauth");
  };

  const retryProfileLoad=()=>{
    if(firebaseUser) void loadAuthenticatedProfile(firebaseUser);
  };
  
  const handleOnboardingComplete=async ({name,level:lv,goal:g})=>{
    if(!user || !user.uid) return;
    const fUser = { ...user, name, level: lv, goal: g, xp: 0, streak: 0, history: [] };
    setUser(fUser); setLevel(lv); setGoal(g);
    const initDecks = [{id:"starter",name:"🌱 A1 Starter Deck",level:"A1",cards:STARTER,created:Date.now()}];
    setLibRaw(initDecks);
    await DB.setUser(fUser.uid, fUser);
    await DB.syncLibrary(fUser.uid, initDecks);
    setAuthState("app");
  };
  
  const handleSignOut=async ()=>{
    if(signOutInFlight.current || authState === "signing_out") return;
    signOutInFlight.current = true;
    setAuthState("signing_out");
    try {
      await authService.signOutUser();
    } catch (error) {
      setAuthError(normalizeAuthError(error));
      setAuthState("app");
    } finally {
      signOutInFlight.current = false;
    }
  };

  const setLibrary=useCallback((action)=>{
    setLibRaw(prev=>{
      const nextState = typeof action==="function"?action(prev):action;
      if(user?.uid) { DB.syncLibrary(user.uid, nextState); }
      return nextState;
    });
  },[user?.uid]);

  const addXP=useCallback((amt)=>{
    setXp(x=>{
      const n=x+amt;
      if(user) DB.setUser(user.uid,{xp:n});
      return n;
    });
    setDailyDone(d=>d+1);
  },[user]);

  const addActivity=useCallback((n=1)=>{
    const td=today();
    setActivityLog(prev=>{
      const next={...prev,[td]:(prev[td]||0)+n};
      if(user) DB.setUser(user.uid,{activityLog:next}).catch(()=>{});
      return next;
    });
  },[user]);

  const addStreak=useCallback(()=>{
    const td=today();
    setLastDay(prev=>{
      if(prev===td)return prev;
      setStreak(s=>{
        const ns = s+1;
        setHistory(h=>{
          const nh = [...h.filter(d=>d!==td),td];
          if(user) DB.setUser(user.uid, {streak: ns, history: nh});
          return nh;
        });
        return ns;
      });
      return td;
    });
  },[user]);

  const onClaimMission = useCallback((def) => {
    setMissions(prev => {
      const updated = prev.filter(m=>m.id!==def.id).concat({id:def.id, claimed:true});
      if(user?.uid) DB.setMissions(user.uid, {date:new Date().toDateString(), missions:updated});
      return updated;
    });
    addXP(def.xpReward);
  },[user, addXP]);

  if(["booting", "authenticated", "profile_loading", "signing_out"].includes(authState)) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
      <div className="text-center text-white"><p className="text-5xl mb-4">🇩🇪</p><p className="text-xl font-extrabold">Deutsch Hub</p><p className="text-sm opacity-70 mt-1">Loading…</p></div>
    </div>
  );
  if(authState==="unauth" || authState==="authenticating" || authState==="auth_error") return <AuthScreen onGoogle={handleGoogle} onCancelGoogle={handleCancelGoogle} googleLoading={authState === "authenticating"} authError={authError}/>;
  if(authState==="profile_load_error") return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8 text-center">
        <h1 className="text-xl font-extrabold text-gray-800">We couldn&apos;t load your profile</h1>
        <p role="alert" className="text-sm text-gray-500 mt-3">{profileError?.message}</p>
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={retryProfileLoad} className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-bold">Try again</button>
          <button type="button" onClick={handleSignOut} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold">Sign out</button>
        </div>
      </div>
    </div>
  );
  if(authState==="onboarding") return <Onboarding onComplete={handleOnboardingComplete}/>;

  const pageTitle = { home: "Home", learn: "Learn", generate: "AI Generator", library: "Library", grammar: "Grammar", explore: "Explore", leaderboard: "Leaderboard", stats: "Profile" }[nav] || "Deutsch Hub";

  return(
    <AppShell
      nav={nav}
      setNav={setNav}
      pageTitle={focusedMode === "srs" ? "Study" : pageTitle}
      focusedMode={focusedMode}
      header={(
        <div className="dh-shell-context">
          <div className="dh-shell-brand" aria-label="Deutsch Hub">
            <span aria-hidden="true" className="dh-shell-brand-mark">D</span>
            <span>Deutsch Hub</span>
          </div>
          <p className="dh-shell-page-context">{pageTitle}</p>
        </div>
      )}
    >
      {nav==="home"&&<HomeTab library={library} addXP={addXP} setNav={setNav} user={user} xp={xp} streak={streak} dailyDone={dailyDone} userGoal={userGoal} setUserGoal={setUserGoal} missions={missions} onClaimMission={onClaimMission}/>}
      {nav==="generate"&&<GeneratePanel level={level} library={library} setLibrary={setLibrary} user={user} setUser={setUser}/>}
      {nav==="learn"&&<Library library={library} setLibrary={setLibrary} addXP={addXP} addStreak={addStreak} addActivity={addActivity} user={user} setUser={setUser} setLevel={setLevel} onFocusedModeChange={setFocusedMode}/>}
      {nav==="library"&&<Library library={library} setLibrary={setLibrary} addXP={addXP} addStreak={addStreak} addActivity={addActivity} user={user} setUser={setUser} setLevel={setLevel} onFocusedModeChange={setFocusedMode}/>}
      {nav==="grammar"&&<GrammarPanel level={level}/>}
      {nav==="explore"&&<ExploreTab library={library} setLibrary={setLibrary} user={user}/>}
      {nav==="leaderboard"&&<Leaderboard currentUser={user}/>}
      {nav==="stats"&&<ProfileTab library={library} xp={xp} streak={streak} goal={goal} setGoal={setGoal} dailyDone={dailyDone} history={history} activityLog={activityLog} user={user} setUser={setUser} onSignOut={handleSignOut} installPrompt={installPrompt} setInstallPrompt={setInstallPrompt} themePreference={themePreference} setThemePreference={handleThemePreference}/>}
    </AppShell>
  );
}
