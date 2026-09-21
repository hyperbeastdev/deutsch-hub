import React from "react";
import PrimaryNavigation from "./PrimaryNavigation";
import BottomNav from "./BottomNav";

export default function AppShell({ nav, setNav, pageTitle, header, focusedMode = false, children }) {
  return (
    <div className={focusedMode ? "dh-shell dh-shell-focused" : "dh-shell"} data-focused-mode={focusedMode || "false"}>
      <div className="dh-shell-layout">
        {!focusedMode && <PrimaryNavigation nav={nav} setNav={setNav} />}
        <div className="dh-shell-main">
          <header className="dh-shell-header">{header}</header>
          <main id="main-content" className="dh-shell-content" aria-labelledby="page-title">
            <h1 id="page-title" className="sr-only">{pageTitle}</h1>
            {children}
          </main>
          {!focusedMode && <BottomNav nav={nav} setNav={setNav} />}
        </div>
      </div>
    </div>
  );
}
