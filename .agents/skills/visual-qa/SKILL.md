---
name: visual-qa
description: Perform browser-based visual, interaction, responsive and accessibility QA for Deutsch Hub changes.
---

# Visual QA

Use this skill for major UI changes, responsive behavior, interaction states or browser regressions.

## Loop

`IMPLEMENT → RUN → RENDER → INSPECT → TEST → FIX → RENDER AGAIN`

1. Run the relevant local app or preview build.
2. Render the changed route in the available browser surface.
3. Inspect layout, hierarchy, overflow, typography, focus and interaction states.
4. Test narrow mobile, wide mobile/tablet and desktop widths.
5. Check console errors, failed network requests and unexpected loading behavior.
6. Check keyboard navigation, accessible names, dialog focus, contrast and reduced motion.
7. Check loading, empty, error, offline and dark-mode states where applicable.
8. Fix findings and render again until the changed flow is stable.

If browser control is unavailable, do not claim browser validation. Record the limitation and complete only the checks that can be evidenced locally.
