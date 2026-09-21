import React from "react";
import { BookOpen, Compass, House, Library, UserRound } from "lucide-react";

const NAV_ITEMS = [
  { key: "home", target: "home", label: "Home", icon: House },
  { key: "learn", target: "learn", label: "Learn", icon: BookOpen },
  { key: "library", target: "library", label: "Library", icon: Library },
  { key: "explore", target: "explore", label: "Explore", icon: Compass },
  { key: "profile", target: "stats", label: "Profile", icon: UserRound },
];

function NavigationButton({ item, nav, setNav, compact = false }) {
  const active = item.target === nav;
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => setNav(item.target)}
      aria-current={active ? "page" : undefined}
      className={[
        "dh-nav-button",
        compact ? "dh-nav-button-mobile" : "dh-nav-button-desktop",
        active ? "dh-nav-button-active" : "",
      ].join(" ")}
    >
      <Icon aria-hidden="true" strokeWidth={1.8} />
      <span>{item.label}</span>
    </button>
  );
}

export default function PrimaryNavigation({ nav, setNav, compact = false }) {
  return (
    <nav className={compact ? "dh-mobile-navigation" : "dh-desktop-navigation"} aria-label="Primary navigation">
      {!compact && (
        <div className="dh-rail-brand" aria-label="Deutsch Hub">
          <span aria-hidden="true" className="dh-rail-mark">D</span>
          <span>
            <strong>Deutsch Hub</strong>
            <small>German learning</small>
          </span>
        </div>
      )}
      <div className={compact ? "dh-mobile-navigation-items" : "dh-desktop-navigation-items"}>
        {NAV_ITEMS.map(item => <NavigationButton key={item.key} item={item} nav={nav} setNav={setNav} compact={compact} />)}
      </div>
    </nav>
  );
}
