import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { auth, db, googleProvider } from "./firebase";
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, limit, updateDoc, increment, where } from "firebase/firestore";
import Groq from "groq-sdk";
import BottomNav from "./components/BottomNav";
import { SpeakBtn, GBadge } from "./components/SharedUI";
import DeckDetail from "./components/DeckDetail";
import AITutorModal from "./components/AITutorModal";
import ExploreTab from "./components/ExploreTab";
import { SUPPORT_URL } from "./config/supportLinks";


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
  async getUser(uid) { 
    try { const d=await getDoc(doc(db,"users",uid)); return d.exists()?d.data():null; } catch(e) { console.error(e); return null; }
  },
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

function detectOverrideLevel(input, selectedLevel) {
  const text = (input || "").toLowerCase();
  if (text.includes("beginner") || text.includes("simple")) return "A1";
  if (text.includes("easy")) return "A2";
  if (text.includes("intermediate")) return "B1";
  if (text.includes("advanced")) return "C1";
  if (text.includes("deep") || text.includes("detailed")) return "C2";
  return selectedLevel;
}

export async function generateAIFlashcards(prompt, level, existingTerms = []) {
  if(!import.meta.env.VITE_GROQ_PROXY_URL) throw new Error("Groq Proxy URL missing in .env");
  const groq = new Groq({ apiKey: "proxy-key", baseURL: import.meta.env.VITE_GROQ_PROXY_URL, dangerouslyAllowBrowser: true });
  
  let excludeContext = "";
  if(existingTerms.length > 0) {
    const clipped = existingTerms.slice(-30).join(", ");
    excludeContext = `\nCRITICAL CONTEXT: The user already has the following terms in their deck. DO NOT generate flashcards for any of these words: ${clipped}.`;
  }

  const effectiveLevel = detectOverrideLevel(prompt, level);

  const sys = `You are an expert German teacher. Create exactly what the user asks for. 
The user's level is: ${effectiveLevel}
Follow CEFR guidelines strictly:
- A1: very basic explanations, simple words
- A2: simple structured sentences
- B1: moderate grammar
- B2: natural conversational tone
- C1: advanced nuance
- C2: deep linguistic explanation

${excludeContext}
  Rules:
  1. If the word is a noun, you MUST include the article in the "back" field (e.g., "der Apfel"), specify gender accurately (der, die, das), and give the plural (e.g., "die Äpfel").
  2. If it's a verb, put "verb" as gender and leave plural blank ("").
  3. Provide an illustrative example sentence in German (exampleDe) and its natural translation (exampleEn).
  
  You MUST output ONLY a valid JSON object matching this structure:
  {
    "cards": [
      {
        "front": "English string",
        "back": "German string with article",
        "gender": "der/die/das/verb",
        "plural": "string or empty string",
        "exampleDe": "German sentence",
        "exampleEn": "English translation"
      }
    ]
  }`;
  const completion = await groq.chat.completions.create({
    messages: [{ role: "system", content: sys }, { role: "user", content: `Task: ${prompt}` }],
    model: "llama-3.1-8b-instant", temperature: 0.5, response_format: { type: "json_object" }
  });
  const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
  return parsed.cards || [];
}

async function generateAITutorResponse(mode, word, userInput, level) {
  if(!import.meta.env.VITE_GROQ_PROXY_URL) throw new Error("Groq Proxy URL missing in .env");
  const groq = new Groq({ apiKey: "proxy-key", baseURL: import.meta.env.VITE_GROQ_PROXY_URL, dangerouslyAllowBrowser: true });
  
  const effectiveLevel = detectOverrideLevel(userInput, level);

  if (mode === "correct") {
    const prompt = `You are a German language tutor.
The user's level is: ${effectiveLevel}

Follow CEFR guidelines strictly:
- A1: very basic explanations
- A2: simple structured sentences
- B1: moderate grammar
- B2: natural conversational tone
- C1: advanced nuance
- C2: deep linguistic explanation

Analyze the following sentence:
"${userInput}"

Return STRICT JSON in this format:
{
  "corrected": "...",
  "mistakes": [
    {
      "original": "...",
      "correct": "...",
      "type": "capitalization | grammar | article | word order",
      "reason": "..."
    }
  ],
  "explanation": "...",
  "improved": ["...", "..."]
}

Rules:
- Identify ALL mistakes, not just one.
- Keep explanation simple and appropriate for ${effectiveLevel} level.
- Be precise
- Improved must contain REAL alternative sentences (not meta text).
- Do not add extra text outside JSON`;
    
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant", temperature: 0.5, response_format: { type: "json_object" }
    });
    return JSON.parse(completion.choices[0]?.message?.content || "{}");
  }

  const prompts = {
    explain: `You are a German language tutor. The user's level is: ${effectiveLevel}
Follow CEFR guidelines strictly for vocabulary and explanation depth:
- A1: very basic explanations
- A2: simple structured sentences
- B1: moderate grammar
- B2: natural conversational tone
- C1: advanced nuance
- C2: deep linguistic explanation

Explain the German word "${word}". Include: gender (if noun), plural form, 2-3 example sentences, common usage tips, and any tricky grammar. Keep it friendly and clear. Respond in plain text (no JSON).`,
    sentences: `You are a German language tutor. The user's level is: ${effectiveLevel}
Generate 5 natural, varied German example sentences using the word "${word}". For each sentence, give the German and then the English translation. Format each as:\n1. [German sentence]\n   → [English translation]`,
  };
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompts[mode] }],
    model: "llama-3.1-8b-instant", temperature: 0.7
  });
  return completion.choices[0]?.message?.content || "No response.";
}

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
function AuthScreen({onDemo,onGoogle}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
        <p className="text-5xl mb-3">🇩🇪</p>
        <h1 className="text-2xl font-extrabold text-gray-800 mb-1">Deutsch Hub</h1>
        <p className="text-sm text-gray-400 mb-7">AI-powered German flashcards<br/>with spaced repetition</p>

        <div className="flex flex-col gap-3 mb-5">
          <button onClick={onGoogle}
            className="flex items-center justify-center gap-3 w-full border-2 border-gray-200 rounded-2xl py-3 font-bold text-gray-700 hover:bg-gray-50 transition-colors text-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
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
      <div className="flex items-center gap-2 mb-1">
        <GBadge g={w.gender} size="lg"/>
        <p className="text-xl font-extrabold">{w.word}</p>
        <SpeakBtn text={w.word}/>
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
          <div className={"w-8 h-8 rounded-xl flex items-center justify-center text-base " + (d.done?"bg-orange-400 text-white":"bg-gray-100 text-gray-300")}>{d.done?"🔥":"-"}</div>
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
    if(opt.id===q.id){setScore(s=>s+1);addXP(20);}
  };
  const next=()=>{setChosen(null);if(idx+1>=cards.length)setDone(true);else setIdx(i=>i+1);};

  if(cards.length<4) return <div className="text-center py-10 text-gray-400"><p className="text-3xl mb-2">🎧</p><p className="text-sm">Need 4+ cards for listening quiz.</p><button onClick={onBack} className="mt-4 text-blue-500 text-sm">← Back</button></div>;

  if(done) return (
    <div className="flex flex-col gap-4 items-center text-center">
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-8 w-full">
        <p className="text-4xl mb-3">{score===cards.length?"🏆":score>cards.length/2?"😊":"💪"}</p>
        <p className="font-extrabold text-2xl text-gray-800">{score} / {cards.length}</p>
        <p className="text-sm text-gray-500 mt-1">Listening accuracy: {Math.round(score/cards.length*100)}%</p>
      </div>
      <button onClick={()=>{setIdx(0);setScore(0);setDone(false);setChosen(null);}} className="w-full bg-blue-600 text-white font-bold py-3 rounded-2xl text-sm">🔁 Retry</button>
      <button onClick={onBack} className="w-full border border-gray-200 text-gray-500 py-3 rounded-2xl text-sm">← Back</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-700 text-xl">←</button>
        <p className="font-bold text-gray-700 flex-1">🎧 Listening &middot; {deck.name}</p>
        <span className="text-xs text-gray-400">{idx+1}/{cards.length}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{width: ((idx/cards.length)*100) + "%"}}/>
      </div>
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 text-center border border-indigo-100">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Listen and choose the correct word</p>
        <button onClick={speak} className="w-20 h-20 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-4xl flex items-center justify-center mx-auto shadow-lg transition-colors">🔊</button>
        <p className="text-xs text-gray-400 mt-3">Tap to hear again</p>
        <button onClick={speakSlow} className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-indigo-200 text-indigo-600 text-xs font-semibold hover:bg-indigo-50 transition-colors shadow-sm">
          🐢 Slow
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
  useEffect(()=>{setFlipped(false);setEditNote(false);setNoteVal(card.note||"");},[card.id]);
  const saveNote=()=>{setNote(card.id,noteVal);setEditNote(false);};
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="w-full max-w-md cursor-pointer" style={{perspective:"1000px"}} onClick={()=>setFlipped(f=>!f)}>
        <div style={{transition:"transform 0.45s",transformStyle:"preserve-3d",transform:flipped?"rotateY(180deg)":"rotateY(0deg)",position:"relative",minHeight:"240px"}}>
          <div style={{backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden"}} className="absolute inset-0 bg-white rounded-2xl shadow-lg flex flex-col items-center justify-center p-6 border border-gray-200">
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-widest">English</p>
            <p className="text-2xl font-bold text-gray-800 text-center">{card.front}</p>
            {card.note&&<p className="mt-3 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1 text-center">📝 {card.note}</p>}
            <p className="absolute bottom-3 left-3 text-xs text-gray-300">tap to flip</p>
            {card.due&&<p className="absolute bottom-3 right-3 text-xs text-gray-300">next: {new Date(card.due).toLocaleDateString()}</p>}
          </div>
          <div style={{backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",transform:"rotateY(180deg)"}} className="absolute inset-0 bg-gray-50 rounded-2xl shadow-lg flex flex-col items-center justify-center p-6 border border-gray-200">
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Deutsch</p>
            <div className="flex items-center gap-2 mb-1"><GBadge g={card.gender}/><p className="text-2xl font-bold text-gray-800">{card.back}</p><SpeakBtn text={card.back}/></div>
            {card.plural&&card.gender!=="verb"&&<p className="text-sm text-gray-500 mb-1">Plural: {card.plural}</p>}
            <div className="mt-2 bg-white rounded-xl p-3 text-center border border-gray-100 w-full">
              <p className="text-sm font-medium text-gray-700 mb-1">{card.exampleDe}</p>
              <div className="flex justify-center mb-1"><SpeakBtn text={card.exampleDe} small/></div>
              <p className="text-xs text-gray-400 italic">{card.exampleEn}</p>
            </div>
          </div>
        </div>
      </div>
      {flipped&&(
        <>
          <div className="flex gap-2 flex-wrap justify-center">
            {[{l:"Again",c:"bg-red-500 hover:bg-red-600",r:0},{l:"Hard",c:"bg-orange-400 hover:bg-orange-500",r:1},{l:"Good",c:"bg-blue-500 hover:bg-blue-600",r:2},{l:"Easy",c:"bg-green-500 hover:bg-green-600",r:3}].map(b=>(
              <button key={b.r} onClick={()=>onRate(b.r)} className={(b.c) + " text-white font-semibold px-5 py-2 rounded-xl text-sm"}>{b.l}</button>
            ))}
          </div>
          <div className="w-full max-w-md">
            {editNote?(<div className="flex gap-2"><input autoFocus className="flex-1 border border-amber-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none" placeholder="Add mnemonic…" value={noteVal} onChange={e=>setNoteVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveNote()}/><button onClick={saveNote} className="bg-amber-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold">Save</button></div>)
            :(<button onClick={e=>{e.stopPropagation();setEditNote(true);}} className="text-xs text-amber-600 hover:text-amber-700">📝 {card.note?"Edit note":"Add mnemonic note"}</button>)}
          </div>
        </>
      )}
      {!flipped&&<p className="text-gray-400 text-sm">Tap the card to reveal</p>}
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
  const pick=(opt)=>{if(chosen)return;setChosen(opt.id);if(opt.id===q.id){setScore(s=>s+1);addXP(15);}};
  const next=()=>{setChosen(null);if(idx+1>=cards.length)setDone(true);else setIdx(i=>i+1);};
  if(cards.length<4)return <div className="text-center py-12 text-gray-400"><p className="text-3xl mb-2">🃏</p><p className="text-sm">Need at least 4 cards.</p><button onClick={onBack} className="mt-4 text-blue-500 text-sm">← Back</button></div>;
  if(done)return(
    <div className="flex flex-col gap-4 items-center text-center">
      <div className="bg-white rounded-2xl shadow border p-8 w-full"><p className="text-4xl mb-3">{score===cards.length?"🏆":score>cards.length/2?"😊":"💪"}</p><p className="font-extrabold text-2xl text-gray-800">{score}/{cards.length}</p><p className="text-sm text-gray-500">{Math.round(score/cards.length*100)}% correct</p></div>
      <button onClick={()=>{setIdx(0);setScore(0);setDone(false);setChosen(null);}} className="w-full bg-blue-600 text-white font-bold py-3 rounded-2xl text-sm">🔁 Retry</button>
      <button onClick={onBack} className="w-full border border-gray-200 text-gray-500 py-3 rounded-2xl text-sm">← Back</button>
    </div>
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2"><button onClick={onBack} className="text-gray-400 hover:text-gray-700 text-xl">←</button><p className="font-bold text-gray-700 flex-1">Quiz &middot; {deck.name}</p><span className="text-xs text-gray-400">{idx+1}/{cards.length}</span></div>
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
  const check=()=>{if(!input.trim())return;const ans=q.back.toLowerCase().trim();const usr=input.toLowerCase().trim();const ok=ans===usr||ans.replace(/^(der|die|das)\s/,"")===usr.replace(/^(der|die|das)\s/,"");setResult(ok);if(ok){setScore(s=>s+1);addXP(20);}};
  const renderDiff=()=>q.back.split("").map((ch,i)=><span key={i} className={input[i]?.toLowerCase()===ch.toLowerCase()?"text-green-600 font-bold":"text-red-500 font-bold"}>{ch}</span>);
  if(!q)return null;
  return(
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2"><button onClick={onBack} className="text-gray-400 hover:text-gray-700 text-xl">←</button><p className="font-bold text-gray-700 flex-1">✍️ Writing &middot; {deck.name}</p><span className="text-xs text-green-600 font-bold">✓ {score}</span></div>
      <div className="bg-white rounded-2xl shadow border p-6 text-center"><p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Translate to German</p><p className="text-2xl font-bold text-gray-800 mb-1">{q.front}</p><p className="text-xs text-gray-400 italic">{q.exampleEn}</p></div>
      <div className="flex gap-2"><input ref={ref} className={"flex-1 border-2 rounded-xl px-4 py-3 text-base focus:outline-none " + (result===null?"border-gray-200 focus:border-blue-400":result?"border-green-400":"border-red-400")} placeholder="Type the German word…" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(result===null?check():setIdx(i=>(i+1)%cards.length))} disabled={result!==null}/>{result===null&&<button onClick={check} className="bg-blue-600 text-white font-bold px-4 rounded-xl">Check</button>}</div>
      {result!==null&&<div className={"rounded-2xl p-4 " + (result?"bg-green-50 border border-green-200":"bg-red-50 border border-red-200")}><div className="flex items-center gap-2 mb-2"><span className="text-xl">{result?"✅":"❌"}</span><span className={"font-bold text-sm " + (result?"text-green-700":"text-red-700")}>{result?"Correct! +20 XP":"Not quite"}</span></div><div className="text-sm mb-1">{renderDiff()}</div><p className="text-xs text-gray-500 mt-1 italic">{q.exampleDe}</p><div className="flex gap-2 mt-3"><SpeakBtn text={q.back}/><button onClick={()=>setIdx(i=>(i+1)%cards.length)} className="ml-auto text-xs bg-blue-600 text-white px-4 py-1.5 rounded-xl font-bold">Next →</button></div></div>}
    </div>
  );
}

// ── SRS SESSION ───────────────────────────────────────────────
export function SRSSession({deck,onBack,onUpdateDeck,addXP,addStreak}) {
  const due=deck.cards.filter(isDue);
  // Sort: weakest (lowest confidence) cards come first
  const [queue]=useState(()=>[...due].sort((a,b)=>((a.confidenceScore??70)-(b.confidenceScore??70))));
  const [idx,setIdx]=useState(0);const [scores,setScores]=useState({0:0,1:0,2:0,3:0});const [done,setDone]=useState(false);const [sessionXP,setSessionXP]=useState(0);
  const setNote=(cid,note)=>onUpdateDeck({...deck,cards:deck.cards.map(c=>c.id===cid?{...c,note}:c)});
  const handleRate=(r)=>{const card=queue[idx];const updated=sm2(card,r);onUpdateDeck({...deck,cards:deck.cards.map(c=>c.id===card.id?updated:c)});const xp=xpFor(r);addXP(xp);setSessionXP(s=>s+xp);setScores(s=>({...s,[r]:s[r]+1}));if(idx+1>=queue.length){setDone(true);addStreak();}else setIdx(i=>i+1);};
  const total=Object.values(scores).reduce((a,b)=>a+b,0);
  if(queue.length===0)return(<div className="flex flex-col gap-4 text-center"><div className="bg-white rounded-2xl shadow border p-8"><p className="text-4xl mb-3">🎉</p><p className="font-bold text-gray-800 text-lg">All caught up!</p><p className="text-sm text-gray-400 mt-1">No cards due right now.</p></div><button onClick={onBack} className="border border-gray-200 text-gray-500 py-3 rounded-2xl text-sm">← Back</button></div>);
  if(done)return(<div className="flex flex-col gap-4"><div className="bg-white rounded-2xl shadow border p-6 text-center"><p className="text-4xl mb-2">🎉</p><p className="font-bold text-gray-800 text-lg">Session complete!</p><p className="text-sm text-green-600 font-bold mt-1">+{sessionXP} XP earned</p></div><div className="bg-white rounded-2xl p-4 shadow border"><p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Results &middot; {total} cards</p><div className="grid grid-cols-4 gap-2">{[{k:0,l:"Again",c:"bg-red-400",t:"text-red-700"},{k:1,l:"Hard",c:"bg-orange-400",t:"text-orange-700"},{k:2,l:"Good",c:"bg-blue-400",t:"text-blue-700"},{k:3,l:"Easy",c:"bg-green-400",t:"text-green-700"}].map(x=><div key={x.k} className="flex flex-col items-center gap-1"><div className={(x.c) + " rounded-xl w-full text-center text-white font-bold text-xl py-2"}>{scores[x.k]}</div><span className={"text-xs font-semibold " + (x.t)}>{x.l}</span></div>)}</div></div><button onClick={onBack} className="border border-gray-200 text-gray-500 py-3 rounded-2xl text-sm">← Back to Library</button></div>);
  const card=queue[idx];
  return(<div className="flex flex-col gap-4"><div className="flex items-center gap-2"><button onClick={onBack} className="text-gray-400 hover:text-gray-700 text-xl">←</button><div className="flex-1"><p className="font-bold text-gray-800 text-sm">{deck.name}</p><p className="text-xs text-gray-400">{queue.length-idx} cards due</p></div><span className="text-xs text-green-600 font-bold">+{sessionXP} XP</span></div><div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{width:`${(idx/queue.length)*100}%`}}/></div><Flashcard card={card} onRate={handleRate} setNote={setNote}/></div>);
}

// ── CARD MODAL ────────────────────────────────────────────────
export function CardModal({card,onSave,onClose}) {
  const [f,setF]=useState(card||{front:"",back:"",gender:"der",plural:"",exampleDe:"",exampleEn:"",note:""});
  return(
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <h3 className="font-bold text-gray-800 mb-4">{card?"✏️ Edit Card":"➕ New Card"}</h3>
        {[["English","front"],["German (with article)","back"],["Plural","plural"],["Example (DE)","exampleDe"],["Example (EN)","exampleEn"],["Mnemonic note","note"]].map(([label,key])=>(
          <div key={key} className="mb-3"><label className="text-xs text-gray-500 font-semibold uppercase">{label}</label><input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-300" value={f[key]||""} onChange={e=>setF(p=>({...p,[key]:e.target.value}))}/></div>
        ))}
        <div className="mb-4"><label className="text-xs text-gray-500 font-semibold uppercase">Gender</label><div className="flex gap-2 mt-1">{["der","die","das","verb"].map(g=><button key={g} onClick={()=>setF(p=>({...p,gender:g}))} className={"flex-1 py-1.5 rounded-lg text-xs font-bold border " + (f.gender===g?GS[g].badge+" border-transparent":"bg-gray-100 text-gray-500 border-gray-200")}>{g}</button>)}</div></div>
        <div className="flex gap-2"><button onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500">Cancel</button><button onClick={()=>{if(f.front&&f.back)onSave(f);}} className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm">Save</button></div>
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
          <p className="font-bold text-gray-700 text-sm uppercase tracking-widest">📖 Grammar Reference &middot; {level}</p>
          <p className="text-xs text-gray-400 mt-1">{LEVELS[level]?.label}</p>
        </div>
        {(GRAMMAR[level]||[]).map((r,i)=>(
          <div key={i} className="border-t border-gray-100">
            <button onClick={()=>setOpen(open===i?null:i)} className="w-full text-left px-4 py-3 flex justify-between items-center hover:bg-gray-50">
              <span className="text-sm font-semibold text-gray-700">{r.title}</span>
              <span className="text-gray-400 text-lg">{open===i?"−":"+"}</span>
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
function Library({library,setLibrary,addXP,addStreak,user,setUser, setLevel}) {
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

  if(openDeck)return <DeckDetail deck={openDeck} setLibrary={setLibrary} onBack={()=>setOpenId(null)} addXP={addXP} addStreak={addStreak} user={user} setUser={setUser} deps={{ uid, today, isWeak, isDue, DB, generateAIFlashcards, generateAITutorResponse, CardModal, SRSSession, QuizMode, WritingPractice, ListeningQuiz, publishPublicDeck: DB.publishPublicDeck.bind(DB) }}/>;

  return(
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold text-gray-800 text-lg">📚 My Library</h2>
        <div className="flex gap-2">
          <button onClick={()=>setImportModal(true)} className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-2 rounded-xl hover:bg-gray-200">📥 Import</button>
          <button onClick={addDeck} className="bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-blue-700">+ New Deck</button>
        </div>
      </div>

      {library.length===0&&<div className="text-center py-12 text-gray-400"><p className="text-4xl mb-2">📭</p><p className="text-sm">No decks yet.</p></div>}

      <div className="flex flex-col gap-3">
        {library.map(deck=>{
          const dueCount=deck.cards.filter(isDue).length;
          const mastery=deck.cards.length>0?Math.round(deck.cards.filter(c=>c.interval>=21).length/deck.cards.length*100):0;
          return(
            <div key={deck.id} className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <div className={"w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 " + (LEVELS[deck.level]?.color || "")}>{deck.level}</div>
                <div className="flex-1 min-w-0">
                  {editId===deck.id?<input autoFocus className="border border-blue-300 rounded-lg px-2 py-1 text-sm w-full focus:outline-none font-bold" value={newName} onChange={e=>setNewName(e.target.value)} onBlur={()=>{setLibrary(l=>l.map(d=>d.id===deck.id?{...d,name:newName||d.name}:d));setEditId(null);}} onKeyDown={e=>e.key==="Enter"&&(setLibrary(l=>l.map(d=>d.id===deck.id?{...d,name:newName||d.name}:d)),setEditId(null))}/>
                  :<p className="font-bold text-gray-800 truncate">{deck.name}</p>}
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-400">{deck.cards.length} cards</p>
                    {dueCount>0&&<span className="text-xs bg-red-100 text-red-600 font-bold px-1.5 rounded-full">{dueCount} due</span>}
                    {mastery>0&&<span className="text-xs text-green-600 font-semibold">{mastery}% mastered</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={()=>{setEditId(deck.id);setNewName(deck.name);}} className="text-xs px-2 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">✏️</button>
                  <button onClick={()=>setConfirmDel(deck.id)} className="text-xs px-2 py-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200">🗑</button>
                  <button onClick={()=>setOpenId(deck.id)} className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 border border-blue-200">Open →</button>
                </div>
              </div>
              {deck.cards.length>0&&<div className="px-4 pb-3">
                <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-green-500 h-1.5 rounded-full" style={{width: mastery + "%"}}/></div>
                <div className="flex gap-1 mt-2 overflow-x-auto">{deck.cards.slice(0,5).map(c=><span key={c.id} className={"shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold " + (GS[c.gender]?.badge || "")}>{c.back}</span>)}{deck.cards.length>5&&<span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-semibold">+{deck.cards.length-5}</span>}</div>
                <div className="flex gap-1 mt-2">{Object.keys(LEVELS).map(l=><button key={l} onClick={()=>changeLevel(deck.id,l)} className={"text-xs px-1.5 py-0.5 rounded-lg font-bold border transition-all " + (deck.level===l ? LEVELS[l].color+" border-transparent" : "bg-gray-100 text-gray-400 border-gray-100")}>{l}</button>)}</div>
              </div>}
            </div>
          );
        })}
      </div>

      {importModal&&(
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={()=>setImportModal(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full" onClick={e=>e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 mb-3">📥 Import Deck</h3>
            <p className="text-xs text-gray-400 mb-3">Paste a shared deck code below</p>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base font-bold text-center uppercase tracking-widest focus:outline-none" placeholder="e.g. X9K2A1" value={importCode} onChange={e=>setImportCode(e.target.value)}/>
            {importErr&&<p className="text-xs text-red-500 mt-1 text-center font-bold">{importErr}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={()=>setImportModal(false)} className="flex-1 py-2 border rounded-xl text-sm text-gray-500">Cancel</button>
              <button onClick={importDeck} disabled={importing} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">{importing?"Importing...":"Import"}</button>
            </div>
          </div>
        </div>
      )}
      {confirmDel&&(
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={()=>setConfirmDel(null)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-xs w-full text-center" onClick={e=>e.stopPropagation()}>
            <p className="text-2xl mb-2">🗑️</p><p className="font-bold text-gray-800 mb-1">Delete this deck?</p><p className="text-xs text-gray-400 mb-4">This cannot be undone.</p>
            <div className="flex gap-2"><button onClick={()=>setConfirmDel(null)} className="flex-1 py-2 rounded-xl border text-sm text-gray-500">Cancel</button><button onClick={()=>delDeck(confirmDel)} className="flex-1 py-2 rounded-xl bg-red-500 text-white font-bold text-sm">Delete</button></div>
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
    }catch(e){setError(`Failed: ${e.message}`);}
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
    }catch(e){setError(`Failed: ${e.message}`);}
    setLoading(false);
  };

  const saveCards=()=>{if(!preview.length)return;if(target==="__new__"){const name=newName.trim()||`Generated – ${level} – ${new Date().toLocaleDateString()}`;setLibrary(l=>[...l,{id:uid(),name,level,cards:preview,created:Date.now()}]);}else{setLibrary(l=>l.map(d=>d.id===target?{...d,cards:[...d.cards,...preview]}:d));}setSaved(true);};

  return(
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">✨ AI Generator &middot; {level}</p>
          <div className="flex gap-2 items-center">
            {user && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">{(user.lastGenDate===today()?(user.dailyGens||0):0)}/5 Used</span>}
            <button onClick={()=>setImportMode(m=>!m)} className={"text-xs px-2 py-1 rounded-lg font-semibold border " + (importMode?"bg-blue-100 border-blue-300 text-blue-600":"bg-gray-100 border-gray-200 text-gray-500")}>📋 Import list</button>
          </div>
        </div>
        {importMode?(
          <><textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" rows={4} placeholder={"Paste words, one per line:\nApfel\nHaus\ngehen"} value={importText} onChange={e=>setImportText(e.target.value)}/><button onClick={importCards} disabled={loading} className="mt-2 w-full bg-blue-600 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50">{loading?"Generating…":"Convert to flashcards"}</button></>
        ):(
          <><div className="flex gap-2 mb-2"><input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder={`e.g. "10 ${level} food vocabulary cards"`} value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&generate()}/><button onClick={generate} disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm">{loading?"…":"Go"}</button></div>
          <div className="flex flex-wrap gap-1">{[`10 ${level} noun cards`,`${level} separable verbs`,`5 ${level} adjective cards`,`${level} weather vocab`].map(ex=><button key={ex} onClick={()=>setPrompt(ex)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg px-2 py-1">{ex}</button>)}</div></>
        )}
        {error&&<p className="text-xs mt-2 text-red-500 font-bold">{error}</p>}
      </div>
      {preview.length>0&&(
        <div className="bg-white rounded-2xl shadow border overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between"><p className="font-bold text-gray-700 text-sm">Preview &middot; {preview.length} cards</p>{saved&&<span className="text-xs text-green-600 font-bold">✓ Saved!</span>}</div>
          <div className="divide-y divide-gray-50 max-h-52 overflow-y-auto">{preview.map(c=><div key={c.id} className="flex items-center gap-2 px-4 py-2"><GBadge g={c.gender}/><span className="text-sm font-medium text-gray-700">{c.back}</span><span className="text-xs text-gray-400">&middot; {c.front}</span><div className="ml-auto"><SpeakBtn text={c.back} small/></div></div>)}</div>
          {!saved&&<div className="p-4 border-t flex flex-col gap-2">
            <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" value={target} onChange={e=>setTarget(e.target.value)}><option value="__new__">➕ Create new deck</option>{library.map(d=><option key={d.id} value={d.id}>{d.name} ({d.cards.length})</option>)}</select>
            {target==="__new__"&&<input className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" placeholder="New deck name (optional)" value={newName} onChange={e=>setNewName(e.target.value)}/>}
            <button onClick={saveCards} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-sm">💾 Save {preview.length} Cards</button>
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
        <div className="p-4 border-b"><p className="font-bold text-gray-700 text-sm uppercase tracking-widest">🏆 Global Leaderboard</p><p className="text-xs text-gray-400 mt-0.5">Top learners by XP</p></div>
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
        <p className="font-bold mb-1">💡 Tip</p>
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
function StatsView({library,xp,streak,goal,setGoal,dailyDone,history,user,onSignOut,installPrompt,setInstallPrompt}) {
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
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h3 className="font-extrabold text-gray-800">🤖 AI Tutor</h3>
            <p className="text-xs text-gray-400 mt-0.5">Powered by LLaMA 3.1</p>
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
  { id:"reviews",  icon:"🃏", label:"Complete 10 reviews",   target:10,  xpReward:50  },
  { id:"learning", icon:"📖", label:"Learn 5 new cards",     target:5,   xpReward:30  },
  { id:"streak",   icon:"🔥", label:"Study 1 deck today",    target:1,   xpReward:20  },
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
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">🎯 Daily Missions</p>
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
                  <span className="text-base">{def.icon}</span>
                  <p className={"text-xs font-semibold " + (missionState.claimed ? "text-green-700" : "text-gray-700")}>{def.label}</p>
                </div>
                {missionState.claimed ? (
                  <span className="text-xs font-bold text-green-600">✅ Claimed</span>
                ) : canClaim ? (
                  <button onClick={() => onClaim(def)} className="text-xs font-bold bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded-lg transition-colors">
                    +{def.xpReward} XP
                  </button>
                ) : (
                  <span className="text-xs text-gray-400 font-bold">{prog}/{def.target}</span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div className={"h-1 rounded-full transition-all " + (missionState.claimed ? "bg-green-400" : "bg-blue-400")} style={{width: pct + "%"}}/>
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
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-gray-800 text-base">🎯 Set Learning Goal</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Target Level</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {LEVEL_ORDER.map(l => (
            <button key={l} onClick={() => setTargetLevel(l)}
              className={"py-2 rounded-xl text-sm font-bold border-2 transition-all " + (targetLevel===l ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-500 hover:border-blue-200")}>
              {l}
            </button>
          ))}
        </div>

        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Timeframe</p>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[30, 60, 90].map(t => (
            <button key={t} onClick={() => setTimeframe(t)}
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

        <button onClick={handleSave} disabled={saving}
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
  return(
    <div className="flex flex-col gap-4">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white">
        <p className="text-sm font-semibold opacity-80">Good {new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"}, {user?.name?.split(" ")[0]||"Learner"}! 👋</p>
        <div className="flex items-center gap-3 mt-1">
          <div><p className="text-2xl font-extrabold">{badge.icon} {badge.label}</p><p className="text-xs opacity-70">{xp} XP &middot; {streak} day streak 🔥</p></div>
        </div>
      </div>
      <WordOfDay addXP={addXP}/>
      <GoalProgressCard userGoal={userGoal} dailyDone={dailyDone} onEdit={()=>setShowGoalModal(true)}/>
      <DailyMissions missions={missions} onClaim={onClaimMission} dailyDone={dailyDone} streak={streak}/>
      {totalDue>0&&<DueBanner library={library} onStudyAll={()=>setNav("library")}/>}
      <div className="grid grid-cols-2 gap-3">
        {[{icon:"📚",label:"My Library",sub:`${library.length} decks`,nav:"library",c:"from-blue-50 to-blue-100 border-blue-200"},{icon:"✨",label:"AI Generate",sub:"Create cards with AI",nav:"generate",c:"from-purple-50 to-purple-100 border-purple-200"},{icon:"📖",label:"Grammar",sub:"Quick reference",nav:"grammar",c:"from-green-50 to-green-100 border-green-200"},{icon:"🏆",label:"Leaderboard",sub:"See top learners",nav:"leaderboard",c:"from-yellow-50 to-orange-100 border-orange-200"}].map(item=>(
          <button key={item.nav} onClick={()=>setNav(item.nav)} className={"bg-gradient-to-br " + (item.c) + " border rounded-2xl p-4 text-left hover:shadow-md transition-all"}>
            <p className="text-2xl mb-1">{item.icon}</p>
            <p className="font-bold text-gray-800 text-sm">{item.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
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
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{d.name}</p><p className="text-xs text-gray-400">{d.cards.length} cards{due > 0 ? " - " + due + " due" : ""}</p></div>
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
  const [authState,setAuthState]=useState("loading"); // loading|unauth|onboarding|app
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
  const [missions,setMissions]=useState([]); // daily mission states
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        let userData = await DB.getUser(fbUser.uid);
        if (!userData) {
          setUser({ uid: fbUser.uid, name: fbUser.displayName || "", email: fbUser.email, avatar: fbUser.displayName?.[0]?.toUpperCase() || "🧑" });
          setAuthState("onboarding"); 
        } else {
          setUser(userData);
          setLevel(userData.level || "A1");
          setGoal(userData.goal || 20);
          setXp(userData.xp || 0);
          setStreak(userData.streak || 0);
          setHistory(userData.history || []);
          const lib = await DB.getLibrary(fbUser.uid);
          setLibRaw(lib);
          const ug = await DB.getUserGoal(fbUser.uid);
          if(ug) setUserGoal(ug);
          const ms = await DB.getMissions(fbUser.uid);
          if(ms && ms.date === new Date().toDateString()) setMissions(ms.missions || []);
          else setMissions([]);
          setAuthState("app");
        }
      } else {
         setUser(null); setLibRaw([]); setXp(0); setStreak(0); setHistory([]); setUserGoal(null); setMissions([]); setAuthState("unauth");
      }
    });
    return unsub;
  },[]);

  const handleDemo=()=>{ /* no-op in real mode */ };
  
  const handleGoogle=async ()=>{
    try { await signInWithPopup(auth, googleProvider); } catch(e) { console.error(e); }
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
  
  const handleSignOut=()=>{ fbSignOut(auth); };

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

  const badge=getBadge(xp);
  const goalPct=Math.min(100,Math.round((dailyDone/Math.max(1,goal))*100));


  if(authState==="loading") return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
      <div className="text-center text-white"><p className="text-5xl mb-4">🇩🇪</p><p className="text-xl font-extrabold">Deutsch Hub</p><p className="text-sm opacity-70 mt-1">Loading…</p></div>
    </div>
  );
  if(authState==="unauth") return <AuthScreen onDemo={handleDemo} onGoogle={handleGoogle}/>;
  if(authState==="onboarding") return <Onboarding onComplete={handleOnboardingComplete}/>;

  return(
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans">
      <div className="max-w-lg mx-auto flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-base font-extrabold text-gray-800 flex-1 tracking-tight">🇩🇪 Deutsch Hub</p>
            <span title={badge.label} className="text-base">{badge.icon}</span>
            <span className="text-xs font-bold text-purple-600">{xp} XP</span>
            <span>🔥</span>
            <span className="text-xs font-bold text-orange-500">{streak}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div className={"h-1.5 rounded-full transition-all " + (goalPct>=100?"bg-green-500":"bg-blue-400")} style={{width:goalPct+"%"}}/>
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">{dailyDone}/{goal} today</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase">CEFR Level:</span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className={"flex-1 border border-gray-200 bg-white text-gray-800 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-300 hover:border-gray-300 transition-colors cursor-pointer shadow-sm"}
              title="This level controls AI difficulty"
            >
              {Object.keys(LEVELS).map(l=>(
                <option key={l} value={l}>{LEVELS[l].label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 pb-24">
          {nav==="home"&&<HomeTab library={library} addXP={addXP} setNav={setNav} user={user} xp={xp} streak={streak} dailyDone={dailyDone} userGoal={userGoal} setUserGoal={setUserGoal} missions={missions} onClaimMission={onClaimMission}/>}
          {nav==="generate"&&<GeneratePanel level={level} library={library} setLibrary={setLibrary} user={user} setUser={setUser}/>}
          {nav==="library"&&<Library library={library} setLibrary={setLibrary} addXP={addXP} addStreak={addStreak} user={user} setUser={setUser} setLevel={setLevel}/>}
          {nav==="grammar"&&<GrammarPanel level={level}/>}
          {nav==="explore"&&<ExploreTab library={library} setLibrary={setLibrary} user={user}/>}
          {nav==="leaderboard"&&<Leaderboard currentUser={user}/>}
          {nav==="stats"&&<StatsView library={library} xp={xp} streak={streak} goal={goal} setGoal={setGoal} dailyDone={dailyDone} history={history} user={user} onSignOut={handleSignOut} installPrompt={installPrompt} setInstallPrompt={setInstallPrompt}/>}
        </div>

        {/* Bottom nav */}
        <BottomNav nav={nav} setNav={setNav} />

      </div>
    </div>
  );
}
