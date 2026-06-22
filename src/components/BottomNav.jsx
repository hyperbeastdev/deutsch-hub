import React from "react";

const NAV = [
  {key:"home", icon:"🏠", label:"Home"},
  {key:"generate", icon:"✨", label:"Generate"},
  {key:"library", icon:"📚", label:"Library"},
  {key:"explore", icon:"🌍", label:"Explore"},
  {key:"stats", icon:"👤", label:"Profile"},
];

export default function BottomNav({ nav, setNav }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-10">
      <div className="max-w-lg mx-auto bg-white border-t border-gray-200 flex">
        {NAV.map(n => (
          <button 
            key={n.key} 
            onClick={() => setNav(n.key)}
            className={"flex-1 flex flex-col items-center py-3 text-[11px] font-semibold transition-colors " + (nav===n.key?"text-blue-600":"text-gray-400 hover:text-gray-600")}
          >
            <span className="text-lg leading-none mb-0.5">{n.icon}</span>{n.label}
          </button>
        ))}
      </div>
    </div>
  );
}
