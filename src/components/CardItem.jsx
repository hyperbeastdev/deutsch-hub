import React from "react";
import { SpeakBtn, GBadge } from "./SharedUI";

export default function CardItem({ card, i, isWeak, onEdit, onDelete }) {
  return (
    <div className={"flex items-center gap-2 px-4 py-3 hover:bg-gray-50 " + (isWeak ? "border-l-4 border-l-red-400 bg-red-50/30" : "")}>
      <span className="text-xs text-gray-300 w-5 shrink-0">{i + 1}</span>
      <GBadge g={card.gender} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{card.back}</p>
        <p className="text-xs text-gray-400 truncate">
          {card.front} {card.interval ? " - " + card.interval + "d" : ""}
        </p>
      </div>
      {isWeak && (
        <span
          className="text-[10px] bg-red-100 text-red-500 font-bold px-1.5 py-0.5 rounded-lg border border-red-200 shrink-0"
          title={"Confidence: " + (card.confidenceScore ?? 70) + "%"}
        >
          ⚠️ Weak
        </span>
      )}
      {card.note && (
        <span className="text-xs text-amber-400 shrink-0" title={card.note}>
          📝
        </span>
      )}
      <SpeakBtn text={card.back} small />
      <button type="button" aria-label={`Edit ${card.back}`} onClick={() => onEdit(card)} className="text-blue-400 hover:text-blue-600 text-xs px-1">✏️</button>
      <button type="button" aria-label={`Delete ${card.back}`} onClick={() => onDelete(card.id)} className="text-red-400 hover:text-red-600 text-xs px-1">✕</button>
    </div>
  );
}
