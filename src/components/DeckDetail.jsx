import React, { useState } from "react";
import { ArrowLeft, Pencil, Trash2, Share2, Globe, AlertTriangle, Brain, CircleHelp, PenLine, Headphones, Bot, Sparkles, Layers, X, Plus } from "lucide-react";
import { SpeakBtn, GBadge } from "./SharedUI";
import { LEVELS } from "../config/constants";
import CardItem from "./CardItem";
import AITutorModal from "./AITutorModal";
import { getAIUserMessage } from "../ai/errors";

export default function DeckDetail({deck,setLibrary,onBack,onFocusedModeChange,addXP,addStreak,user,setUser, deps}) {
  const { uid, today, isWeak, isDue, DB, generateAIFlashcards, generateAITutorResponse, CardModal, SRSSession, QuizMode, WritingPractice, ListeningQuiz, addActivity, publishPublicDeck } = deps;
  const [editCard,setEditCard]=useState(null);
  const [search,setSearch]=useState("");
  const [editName,setEditName]=useState(false);
  const [newName,setNewName]=useState(deck.name);
  const [mode,setMode]=useState(null);
  const [shareMsg,setShareMsg]=useState("");
  const [aiMode,setAiMode]=useState(false);
  const [aiPrompt,setAiPrompt]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  const [aiErr,setAiErr]=useState("");
  const [weakFilter,setWeakFilter]=useState(false);
  const [aiTutorOpen,setAiTutorOpen]=useState(false);
  const [publishState,setPublishState]=useState("idle"); // idle | loading | done | error
  const [publishMsg,setPublishMsg]=useState("");

  const changeMode = (nextMode) => {
    setMode(nextMode);
    onFocusedModeChange?.(nextMode || false);
  };
  const exitMode = () => {
    setMode(null);
    onFocusedModeChange?.(false);
  };

  const runAIAdd = async () => {
    if(!aiPrompt.trim()) return;
    if(user) {
      const td = today();
      const used = user.lastGenDate === td ? (user.dailyGens || 0) : 0;
      if(used >= 5) { setAiErr("⏳ Daily limit reached (5/5). Come back tomorrow!"); return; }
    }
    setAiLoading(true); setAiErr("");
    try {
      const existingTerms = deck.cards.map(c => c.front);
      const cards = await generateAIFlashcards(aiPrompt, deck.level, existingTerms);
      if(cards.length > 0) {
        setLibrary(l=>l.map(d=>d.id===deck.id?{...d,cards:[...d.cards,...cards.map(c=>({...c,id:uid()}))]}:d));
        setAiPrompt(""); setAiMode(false);
        if(user) {
          const td = today();
          const used = user.lastGenDate === td ? (user.dailyGens || 0) : 0;
          const nextUser = { ...user, lastGenDate: td, dailyGens: used + 1 };
          setUser(nextUser); await DB.setUser(user.uid, { lastGenDate: td, dailyGens: used + 1 });
        }
      } else { setAiErr("No cards generated."); }
    } catch(e) { setAiErr(getAIUserMessage(e)); }
    setAiLoading(false);
  };

  const upd=(fn)=>setLibrary(l=>l.map(d=>d.id===deck.id?fn(d):d));
  const saveCard=(card)=>{upd(d=>{const exists=d.cards.find(c=>c.id===card.id);const cards=exists?d.cards.map(c=>c.id===card.id?card:c):[...d.cards,{...card,id:uid()}];return{...d,cards};});setEditCard(null);};
  const delCard=(id)=>upd(d=>({...d,cards:d.cards.filter(c=>c.id!==id)}));
  const rename=()=>{upd(d=>({...d,name:newName||d.name}));setEditName(false);};
  const updateDeck=(d)=>setLibrary(l=>l.map(x=>x.id===d.id?d:x));
  const shareDeck=async()=>{
    if(!user) return setShareMsg("Login required");
    setShareMsg("Generating...");
    const code=await DB.publishDeck(deck, user.uid);
    if(code){
      navigator.clipboard?.writeText(code).then(()=>setShareMsg(`✓ Code copied: ${code}`)).catch(()=>setShareMsg(`Code: ${code}`));
      setTimeout(()=>setShareMsg(""),6000);
    } else {
      setShareMsg("Failed to share.");
      setTimeout(()=>setShareMsg(""),3000);
    }
  };
  const handlePublish = async () => {
    if (!user) { setPublishMsg("Login required to publish."); return; }
    if (!deck.cards || deck.cards.length === 0) { setPublishMsg("Add cards before publishing."); return; }
    setPublishState("loading"); setPublishMsg("");
    const result = await publishPublicDeck(deck, user);
    if (result?.success) {
      setPublishState("done"); setPublishMsg("Published!");
    } else if (result?.error === "already_published") {
      setPublishState("done"); setPublishMsg("Already published.");
    } else if (result?.error === "not_logged_in") {
      setPublishState("error"); setPublishMsg("Login required.");
    } else if (result?.error === "empty_deck") {
      setPublishState("error"); setPublishMsg("Add cards first.");
    } else {
      setPublishState("error"); setPublishMsg("Publish failed. Try again.");
    }
  };

  const filtered=deck.cards.filter(c=>{
    const matchSearch = c.back.toLowerCase().includes(search.toLowerCase())||c.front.toLowerCase().includes(search.toLowerCase());
    const matchWeak = !weakFilter || isWeak(c);
    return matchSearch && matchWeak;
  });
  const dueCount=deck.cards.filter(isDue).length;
  const masteredCount=deck.cards.filter(c=>c.interval>=21).length;
  const weakCount=deck.cards.filter(isWeak).length;

  if(mode==="srs")return <SRSSession deck={deck} onBack={exitMode} onUpdateDeck={updateDeck} addXP={addXP} addStreak={addStreak} addActivity={addActivity}/>;
  if(mode==="quiz")return <QuizMode deck={deck} onBack={exitMode} addXP={addXP}/>;
  if(mode==="writing")return <WritingPractice deck={deck} onBack={exitMode} addXP={addXP}/>;
  if(mode==="listening")return <ListeningQuiz deck={deck} onBack={exitMode} addXP={addXP}/>;

  return(
    <div className="flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex items-start gap-2">
        <button type="button" aria-label="Back to library" onClick={onBack} className="text-gray-400 hover:text-gray-700 mt-0.5 p-0.5 rounded"><ArrowLeft size={18} aria-hidden="true" /></button>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          {editName
            ? <input autoFocus className="border border-blue-300 rounded-lg px-2 py-1 text-sm w-full focus:outline-none font-bold" value={newName} onChange={e=>setNewName(e.target.value)} onBlur={rename} onKeyDown={e=>e.key==="Enter"&&rename()}/>
            : <div className="flex items-center gap-2">
                <p className="font-extrabold text-gray-800 text-base truncate">{deck.name}</p>
                <button type="button" aria-label={`Edit deck name: ${deck.name}`} onClick={()=>{setEditName(true);setNewName(deck.name);}} className="text-gray-400 hover:text-gray-600 shrink-0 p-0.5 rounded"><Pencil size={13} aria-hidden="true" /></button>
              </div>
          }
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-gray-400">{deck.cards.length} cards &middot; {new Date(deck.created).toLocaleDateString()}</p>
            <span className={"text-xs px-2 py-0.5 rounded-full font-bold " + (LEVELS[deck.level]?.color)}>{deck.level}</span>
          </div>
        </div>

        {/* Header actions: Share + Publish */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={shareDeck}
            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-3 py-1.5 rounded-xl text-xs transition-colors"
          ><Share2 size={13} aria-hidden="true" /> Share</button>
          <button
            onClick={handlePublish}
            disabled={publishState==="loading" || publishState==="done"}
            className={"flex items-center gap-1 font-semibold px-3 py-1.5 rounded-xl text-xs transition-all " +
              (publishState==="done"
                ? "bg-green-100 text-green-600 cursor-default"
                : publishState==="loading"
                ? "bg-gray-100 text-gray-400 cursor-wait"
                : "bg-emerald-600 hover:bg-emerald-700 text-white")}
          >
            {publishState==="loading" ? "…" : publishState==="done" ? "Published" : <><Globe size={13} aria-hidden="true" /> Publish</>}
          </button>
        </div>
      </div>

      {/* Status messages (share / publish) */}
      {(shareMsg||publishMsg) && (
        <div className="flex flex-col gap-0.5">
          {shareMsg  && <p className="text-xs text-blue-600 font-semibold text-center bg-blue-50 rounded-lg px-3 py-1.5">{shareMsg}</p>}
          {publishMsg && <p className={"text-xs font-semibold text-center rounded-lg px-3 py-1.5 " + (publishState==="error"?"bg-red-50 text-red-500":"bg-green-50 text-green-600")}>{publishMsg}</p>}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-xl shadow border p-3 text-center"><p className="text-xl font-extrabold text-blue-600">{dueCount}</p><p className="text-xs text-gray-400">Due now</p></div>
        <div className="bg-white rounded-xl shadow border p-3 text-center"><p className="text-xl font-extrabold text-green-600">{masteredCount}</p><p className="text-xs text-gray-400">Mastered</p></div>
        <div className="bg-white rounded-xl shadow border p-3 text-center"><p className="text-xl font-extrabold text-purple-600">{deck.cards.length>0?Math.round(masteredCount/deck.cards.length*100):0}%</p><p className="text-xs text-gray-400">Mastery</p></div>
      </div>
      {weakCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-red-700">{weakCount} Weak {weakCount===1?"Word":"Words"}</p>
              <p className="text-xs text-red-400">Low confidence — needs more practice</p>
            </div>
          </div>
          <button onClick={()=>setWeakFilter(w=>!w)} className={"text-xs font-bold px-3 py-1.5 rounded-xl border transition-all " + (weakFilter?"bg-red-500 text-white border-red-500":"bg-white text-red-500 border-red-300 hover:bg-red-50")}>
            {weakFilter ? "All Cards" : "Show Weak"}
          </button>
        </div>
      )}

      {/* Study — primary full-width */}
      <button
        type="button"
        onClick={()=>changeMode("srs")}
        disabled={dueCount===0}
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-sm"
      >
        <Brain size={18} aria-hidden="true" />
        Study{dueCount>0 ? ` — ${dueCount} card${dueCount===1?"":"s"} due` : " — all caught up"}
      </button>

      {/* Practice modes — secondary 3-col row */}
      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={()=>changeMode("quiz")} disabled={deck.cards.length<4}
          className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50 disabled:opacity-40 transition-colors text-center">
          <CircleHelp size={18} className="text-purple-500" aria-hidden="true" />
          <span className="text-xs font-bold text-gray-800">Quiz</span>
          <span className="text-[10px] text-gray-400 leading-tight">4 options · recall</span>
        </button>
        <button type="button" onClick={()=>changeMode("writing")} disabled={deck.cards.length===0}
          className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50 disabled:opacity-40 transition-colors text-center">
          <PenLine size={18} className="text-orange-500" aria-hidden="true" />
          <span className="text-xs font-bold text-gray-800">Writing</span>
          <span className="text-[10px] text-gray-400 leading-tight">Type the answer</span>
        </button>
        <button type="button" onClick={()=>changeMode("listening")} disabled={deck.cards.length<4}
          className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-40 transition-colors text-center">
          <Headphones size={18} className="text-indigo-500" aria-hidden="true" />
          <span className="text-xs font-bold text-gray-800">Listening</span>
          <span className="text-[10px] text-gray-400 leading-tight">Hear &amp; identify</span>
        </button>
      </div>

      {/* ── Card controls: Search + AI Tutor + Add ── */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="Search cards…" value={search} onChange={e=>setSearch(e.target.value)}/>
          <button type="button" onClick={()=>setAiTutorOpen(true)} aria-label="Open AI Tutor" className="flex items-center gap-1.5 bg-indigo-100/80 text-indigo-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-indigo-200 transition-colors shadow-sm" title="AI Tutor">
            <Bot size={16} aria-hidden="true" />
            <span>Tutor</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={()=>setEditCard({card:null})} className="flex justify-center items-center gap-2 bg-blue-600 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-sm">
            <Plus size={16} aria-hidden="true" />
            <span>Add Card</span>
          </button>
          <button onClick={()=>setAiMode(true)} className="flex justify-center items-center gap-2 bg-purple-600 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-purple-700 transition-colors shadow-sm">
            <Sparkles size={16} aria-hidden="true" />
            <span>AI Generate</span>
          </button>
        </div>
      </div>
      
      {aiMode && (
        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-purple-600 uppercase tracking-widest"><Sparkles size={13} aria-hidden="true" /> AI Generation</span>
            {user && <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-xl border border-purple-200">{(user.lastGenDate===today()?(user.dailyGens||0):0)}/5 Used</span>}
          </div>
          <div className="flex gap-2">
            <input className="flex-1 px-3 py-2 rounded-lg text-sm border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300" placeholder={`e.g. "5 ${deck.level} food templates"`} value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&runAIAdd()}/>
            <button onClick={runAIAdd} disabled={aiLoading} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors shadow-sm">{aiLoading ? "..." : "Generate & Add"}</button>
            <button onClick={()=>setAiMode(false)} className="px-3 py-2 rounded-xl text-sm font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">Cancel</button>
          </div>
          {aiErr&&<p role="alert" className="text-xs text-red-500 font-bold text-center mt-1">{aiErr}</p>}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow border overflow-hidden">
        {filtered.length===0?<div className="text-center py-10 text-gray-400"><Layers size={32} className="mx-auto mb-2 opacity-40" aria-hidden="true" /><p className="text-sm">{deck.cards.length===0?"No cards yet. Add one!":"No match."}</p></div>
        :<div className="divide-y divide-gray-50">
          {filtered.map((card,i)=>(
            <div key={card.id} className={"flex items-center gap-2 px-4 py-3 hover:bg-gray-50 " + (isWeak(card)?"border-l-4 border-l-red-400 bg-red-50/30":"")}>
              <span className="text-xs text-gray-300 w-5 shrink-0">{i+1}</span>
              <GBadge g={card.gender}/>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{card.back}</p><p className="text-xs text-gray-400 truncate">{card.front} {card.interval ? " - " + card.interval + "d" : ""}</p></div>
              {isWeak(card)&&<span className="flex items-center gap-0.5 text-[10px] bg-red-100 text-red-500 font-bold px-1.5 py-0.5 rounded-lg border border-red-200 shrink-0" title={"Confidence: " + (card.confidenceScore ?? 70) + "%"}><AlertTriangle size={10} aria-hidden="true" /> Weak</span>}
              {card.note&&<span className="text-xs text-amber-400 shrink-0" title={card.note}>📝</span>}
              <SpeakBtn text={card.back} small/>
              <button type="button" aria-label={`Edit ${card.back}`} onClick={()=>setEditCard({card})} className="text-blue-400 hover:text-blue-600 p-1 rounded"><Pencil size={13} aria-hidden="true" /></button>
              <button type="button" aria-label={`Delete ${card.back}`} onClick={()=>delCard(card.id)} className="text-red-400 hover:text-red-600 p-1 rounded"><X size={13} aria-hidden="true" /></button>
            </div>
          ))}
        </div>}
      </div>
      {editCard&&<CardModal card={editCard.card} onClose={()=>setEditCard(null)} onSave={saveCard}/>}
      {aiTutorOpen&&<AITutorModal deck={deck} onClose={()=>setAiTutorOpen(false)} generateAITutorResponse={generateAITutorResponse}/>}
    </div>
  );
}
