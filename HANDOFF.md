# Deutsch Hub — Project Continuity Handoff

Last updated: 2026-09-21

This is the canonical cross-session handoff. Read it before making project changes. It records the repository state through the Phase 3 Study accessibility follow-up and controlled-QA boundary.

## 1. Project identity

Deutsch Hub is a German-learning PWA for vocabulary acquisition. It combines flashcards, spaced repetition, multiple practice modes, AI-assisted card generation and tutoring, personal and community decks, browser TTS, goals, progress and lightweight motivation.

The product direction is calm, intelligent, warm, focused and intentional. Learning should be the primary experience; AI, gamification and visual treatment must support learner intent rather than become the product identity.

Current user-facing capabilities include:

- Google-authenticated onboarding and learner profile.
- Personal decks and cards, deck import/share and community/public deck surfaces.
- Study/SRS, quiz, writing and listening modes.
- AI card generation, AI Tutor explanations/sentences and sentence correction.
- Browser Speech Synthesis controls, with a localhost-only Google TTS proxy.
- Home progress, daily goals, missions, streak/XP and profile statistics.
- PWA manifest and service-worker registration.

## 2. Current technology stack

- React 19 and Vite 8.
- Tailwind CSS 3 plus existing global CSS.
- Firebase Authentication with Google sign-in.
- Firestore accessed directly from the client through the current data layer.
- Cloudflare Worker proxying hosted Groq requests.
- Current hosted model: `openai/gpt-oss-20b`.
- AI boundary currently in `src/ai/`: configuration, provider-neutral errors, schemas, service and Groq adapter.
- Browser Speech Synthesis for production TTS; a Vite-only local Google TTS proxy also exists.
- Firebase Hosting deployment with SPA rewrites.
- PWA manifest and a registered service worker that is not yet a full offline cache/sync implementation.
- Node built-in test runner via `node --test`.
- ESLint via `npm run lint`.
- Vite production build via `npm run build`.
- Playwright MCP and `.playwright-mcp/` evidence are available in this environment, but browser verification must always be reported by actual evidence.

## 3. Architecture state

### Implemented

- A single React/Vite application whose main feature orchestration remains in `src/App.jsx`.
- Firebase Auth and direct Firestore persistence remain in use.
- Cloudflare remains the hosted AI proxy boundary.
- AI feature calls now use the application-level service in `src/ai/service.js` and the current Groq adapter rather than feature components directly constructing Groq clients.
- Hosted model configuration is centralized in `src/ai/config.js`.
- Provider errors are normalized in `src/ai/errors.js`; structured AI responses are checked in `src/ai/schemas.js`.
- Initial theme and accessibility foundation files exist from the interrupted Phase 0/1 task; their completion status is recorded below.

### Partial / in progress

- The application still has a large inline `App.jsx` and feature boundaries are incomplete.
- Firestore still uses the existing client-oriented data shape and whole-library update patterns in places.
- The semantic token foundation exists, but most feature classes still use existing Tailwind literals.
- Dark mode currently affects the semantic foundation and global canvas/text; a complete visual dark migration has not been performed.
- Accessibility corrections have been applied in several current surfaces, but full interaction coverage and regression QA are unfinished.
- The service worker is registered but does not yet provide robust offline-first caching or synchronization.

### Planned

- Incremental feature boundaries, domain services and repository adapters.
- Scalable Firestore collections/subcollections with an explicit migration and rollback plan.
- Offline-first learning and synchronization.
- Robust SRS improvements, only with tests and explicit approval.
- Provider-agnostic AI routing, quotas, fallback policy and future BYOK safety.
- More complete responsive, accessibility, performance and automated browser quality gates.

### Deferred

- Gemini, OpenRouter, BYOK and automatic provider fallback.
- Cloudflare Worker redesign.
- Firebase replacement or Firestore migration.
- Zustand, a new router, TypeScript migration and App.jsx decomposition.
- Full design-system migration and broad UI redesign.
- Figma/Mobbin dependency or external generic design-system adoption.

## 4. Completed project history

The following history is preserved as project context. “Verified” means it was established by repository work or the recorded verification state; it does not mean every future acceptance criterion is complete.

- **Architecture audit — completed/documented.** The existing React/Vite, Firebase, Firestore, Worker, AI, TTS, SRS, PWA, styling, deployment and testing structure was inspected and documented.
- **AI reliability work — completed/documented.** The retired `llama-3.1-8b-instant` failure was identified as `model_not_found`; the confirmed working hosted model is `openai/gpt-oss-20b` through the existing Worker.
- **AI service abstraction — implemented.** `src/ai/config.js`, `errors.js`, `schemas.js`, `service.js`, `providers/groq.js` and `service.test.js` establish the first provider boundary, normalization and structured validation seam. Gemini/OpenRouter/BYOK/fallback were intentionally not implemented.
- **Documentation consolidation — completed/documented.** Canonical project knowledge was organized under `docs/`; `FEATURES.md` and the public `README.md` were preserved in the worktree and must not be deleted without a separate decision.
- **Agent OS/rules/skills — present.** `AGENTS.md`, `.agents/rules/`, `.agents/skills/` and `.agents/agents/` define project instructions and reusable procedures.
- **Tooling discovery — completed as a discovery phase.** Available browser/design/tooling capabilities were assessed without installing arbitrary design tooling.
- **Browser QA setup — present.** `.playwright-mcp/` contains browser snapshots, scripts/configuration and evidence from prior QA work.
- **Authenticated browser access — established.** Local authenticated access through `http://localhost:5173` was established using the real Firebase session; this is not a fake-user architecture.
- **Full authenticated UX/UI audit — completed/documented.** The authenticated product surfaces were audited and evidence was captured under `.playwright-mcp/`; the findings informed the design direction.
- **Design Direction V1 — completed as planning work.** It is a proposal, not an implementation.
- **Design Constitution V1 — approved as canonical specification.** It governs future implementation and is captured in the design documentation and the principles below.
- **Phase 0 + Phase 1 — scoped implementation completed and accepted.** Browser verification covered the available interaction paths; rating persistence and assistive-technology coverage remain explicitly unverified.
- **Phase 2 application shell — implemented and narrowly browser-verified in this session.** The shell adds the approved Home/Learn/Library/Explore/Profile navigation boundary, responsive desktop rail/mobile bottom navigation, semantic shell landmarks and focused-mode navigation suppression. Individual screen redesigns and the later phases remain untouched.
- **Phase 2 shell corrections — implemented and verified.** Removed duplicate desktop-rail branding while preserving the global header brand, and gave Learn and Library distinct inline semantic icons. The Learn-to-Library compatibility seam remains intentionally temporary.
- **Playwright CLI migration — installed and smoke-tested.** The project-local official CLI is available, with Chromium installed and unauthenticated local smoke evidence captured. Authenticated CLI state reuse remains an explicit environment limitation.
- **Phase 3 Study mode — implemented, not automatically accepted.** The existing Study/SRS flow now has a focused, content-led presentation with responsive card composition, explicit session progress, semantic empty/completion/results states and preserved keyboard/TTS/rating behavior. Human review remains required before Phase 4.
- **Isolated QA environment — provisioned for the verified lifecycle checks.** The separate Firebase project `deutsch-hub-qa`, its web app, default Firestore database, Google sign-in setup and dedicated QA account exist. Local Vite configuration can target it through ignored QA environment values.
- **Local QA Firestore rules — deployed to QA only.** `firestore.qa.rules` and the isolated `firebase.qa.json` config define least-privilege QA authorization. The rules were deployed to `deutsch-hub-qa`; production rules were intentionally not copied and production was not modified.

## 5. Canonical design constitution

The approved constitution requires:

- Learning before feature promotion.
- Study as a focused mode with minimal cognitive competition.
- Content before decoration.
- Semantic color rather than arbitrary visual filling.
- One primary action per context.
- Purposeful surfaces: a surface exists to communicate hierarchy, state or containment.
- Density follows task: focused learning is low density, browsing is medium density, management/analytics may be denser.
- Responsive composition changes by task and viewport; it is not merely a squeezed desktop layout.
- AI is subordinate to learner intent and should feel like a learning capability inside Deutsch Hub.
- Gamification supports learning and must not define the visual identity.
- Accessibility is interaction design, not a final compliance pass.
- Motion explains state change; reduced motion preserves state without decorative movement.
- Empty space is allowed when it improves focus, grouping or comprehension.
- Preserve context across transitions so the learner understands where they are and what changed.
- AI-generated content should be distinguishable when trust or review requires it.

The product is not trying to become a generic AI/SaaS dashboard, a feature marketplace, a game-first app or a copy of another language-learning product.

## 6. Locked design decisions and open decisions

### Locked

- Primary navigation model: **Home / Learn / Library / Explore / Profile**. Existing code may still expose the older labels/implementation; migration must be incremental and preserve behavior until the shell phase is explicitly approved.
- Home uses a **dynamic next action**: due review, active session, active goal, new-learner setup or the absence of due cards determines the most useful next step.
- Generate is **contextual plus discoverable**, not the product’s primary identity.
- Use a small approved icon library for future implementation; **Lucide is the candidate**, pending the explicit dependency/approval step.
- Emoji must not be the primary navigation or control icon system. Existing emoji may remain temporarily while surfaces are migrated.
- Theme defaults to **System**, with explicit Light/Dark overrides that persist.
- Responsive modals use a mobile sheet and desktop dialog pattern.
- Visual direction is warm-neutral and restrained.
- Semantic token architecture is the foundation for future visual migration.
- Study remains the crown-jewel focused learning experience.

### Human decisions still required

- Final approval and installation of the icon library, including whether Lucide is adopted.
- Exact final color values and visual temperature refinement; Phase 1 should use the conservative existing palette.
- The exact timing and scope of the Home/primary-navigation migration.
- Final interval visibility and study-prompt direction where the audit did not settle a single answer.
- When and how generated-content trust labels are surfaced.

## 7. Product reasoning to preserve

- The main product problem is hierarchy and focus, not a lack of features.
- The redesign must not become another generic SaaS/AI dashboard.
- Study should minimize cognitive competition so German content, recall and feedback remain primary.
- Desktop space is justified only when it improves learning, orientation, navigation or comparison; it must not be filled with artificial dashboard panels.
- AI is a capability inside a German-learning product, not the product identity.
- Gamification can motivate practice, but it supports learning rather than defining the visual language.
- Existing learning information—German word, article/gender, plural, examples, translation, audio and SRS feedback—must survive visual simplification.
- Abstraction should follow shared behavior, semantics, state and accessibility contracts, not visual resemblance alone.

## 8. Anti-slop rules

- Do not use a generic AI/SaaS aesthetic or external template as the product identity.
- Do not add decorative gradients, glassmorphism, ornamental animation or arbitrary color.
- Do not make every element a card or use excessive pills, badges, rounded containers or nested surfaces.
- Do not use emoji-heavy primary controls or emoji as the only accessible name.
- Do not turn Home into a giant dashboard.
- Do not create large empty hero areas without a learning or orientation purpose.
- Do not abstract components merely because two elements look visually similar.
- Do not adopt a generic design system as a replacement for Deutsch Hub’s own constitution.
- Do not install UI/UX Pro Max, generic frontend-design frameworks, Mobbin MCP or Figma MCP as implementation dependencies.
- Mobbin may be research only; Figma may be a later design/handoff tool, never an implementation dependency or source of runtime truth.

## 9. Current Phase 0 + Phase 1 state

### Phase 0 — interaction/accessibility contracts

**Status: implementation complete for the scoped contracts; browser-verified for the available flows; final acceptance remains limited by rating persistence and assistive-technology coverage.**

Present repository work includes:

- `src/hooks/useDialogA11y.js` with focus capture/restoration, initial focus, Tab trapping, Escape handling and body-scroll locking.
- Study card keyboard Enter/Space reveal behavior, dynamic accessible name, `aria-expanded`, mutually exclusive face visibility, polite reveal status and semantic rating group/button labels.
- Dialog semantics and hook integration in CardModal, LearningPathModal, AI Tutor, import and deck-delete dialogs.
- Header/main/nav landmarks, active navigation state, page heading, CEFR label and accessible names for existing icon/TTS controls.
- Existing loading/error regions marked where the markup already existed.
- Global reduced-motion CSS behavior.

Known incomplete or unverified items:

- Rating persistence was not verified because no controlled QA account/deck was available. A later Phase 3 browser pass accidentally mutated the real account; those ratings are not acceptance evidence.
- Screen-reader/assistive-technology verification was not performed.
- Full zoom and touch-specific regression coverage remains outstanding.
- The current card-level delete control in Deck Detail is an immediate delete with no confirmation dialog; this is an existing behavior and was not redesigned during the handoff stop.

Verified in the resumed narrow browser pass:

- Goal, import and deck-delete dialogs expose dialog semantics, labelled titles, initial focus, body-scroll locking, Escape close, focus trapping and trigger-focus restoration.
- Study front/revealed accessibility snapshots, Enter/Space reveal behavior, dynamic accessible names, polite status text and rating control names/types.
- Home, Library, Deck Detail and Study remained reachable without horizontal overflow at 390×844, 768×1024 and 1440×900.
- No console errors or warnings were returned during the final browser session.

### Phase 1 — semantic foundation

**Status: scoped implementation complete and verified. Full visual token migration remains intentionally deferred.**

Present repository work includes:

- `src/theme/theme.js` with `system|light|dark`, storage key `deutsch-hub-theme`, safe storage fallback, resolution and root `data-theme` application.
- `src/theme/tokens.css` with semantic canvas/surface/text/status/review/CEFR/gender, typography, spacing, radius, elevation and motion tokens for conservative light/dark foundations.
- `src/theme/theme.test.js` with DOM-free Node tests.
- Theme preference select in the existing Profile/Stats area.
- Token import through `src/main.jsx` and safe global foundation styles in `src/index.css`.

Known incomplete or unverified items:

- Existing feature Tailwind classes were intentionally not migrated.
- Full dark visual migration is deferred.

Verified after the final `theme.js` robustness adjustment:

- DOM-free theme tests pass.
- System preference resolves to both light and dark browser emulations.
- Explicit Light/Dark preferences persist through reload and override system preference.
- Reduced-motion emulation reduces transition/animation duration and disables smooth scrolling.

## 9A. Current Phase 2 state

**Status: application shell implemented and narrowly verified. Phase 3 has not started.**

Implemented:

- AppShell.jsx owns the authenticated shell structure, semantic header/main landmarks and focused-mode shell state.
- PrimaryNavigation.jsx defines the shared Home/Learn/Library/Explore/Profile navigation model with text labels, inline non-emoji icons and aria-current.
- BottomNav.jsx remains the mobile navigation entry point and delegates to the shared navigation implementation.
- index.css adds semantic-token-based shell layout styles for mobile bottom navigation and desktop rail navigation at the tablet/desktop breakpoint.
- App.jsx routes the approved navigation model into the existing feature surfaces. Learn currently aliases the existing Library surface as a compatibility seam; no new learning screen was invented.
- DeckDetail.jsx reports entry and exit from existing Study, Quiz, Writing and Listening modes so the normal shell navigation is suppressed during focused learning.
- The desktop rail no longer renders a second Deutsch Hub brand; the global/page header remains the shell’s single brand identity.
- Learn uses an open-book icon and Library uses a stacked-content icon through the existing inline SVG approach. No icon dependency was added.

Deliberately not implemented:

- No Home, Study, Library, Deck, Explore, Profile or learning-mode visual redesign.
- No navigation destination or feature removal. Generate, Grammar and Leaderboard remain contextually reachable through existing app surfaces.
- No new dependency or icon library. Lucide remains a future approval item.
- No Firebase, Firestore, Cloudflare, AI, TTS, SRS, authentication or persistence changes.
- Phase 3 Study work is recorded separately below; no Phase 4 or later work was started.

Narrow browser evidence:

- Authenticated Home, Learn, Library and Profile routes were reached.
- Desktop rail rendered at 1440x900; tablet rail rendered at 768x1024; mobile bottom navigation rendered at 390x844.
- No horizontal overflow was observed at those viewports.
- Existing Deck Detail opened, Study entered, shell navigation was hidden during Study, and Back from Study restored the normal navigation.
- Existing Study card remained keyboard-operable with Enter and Space; rating controls remained named and reachable.
- No browser console errors or warnings were returned during the shell verification session.

## 9B. Browser QA tooling state

**Status: Playwright CLI is the default future browser-QA mechanism; authenticated state reuse is not yet established.**

Implemented:

- Project-local dependency: @playwright/cli 0.1.21.
- CLI executable verified with npx --no-install playwright-cli --version.
- Chromium runtime installed for the CLI without the optional headless-shell binary, using the Playwright runtime installer.
- A named persistent session strategy was verified with the deutsch-hub-qa session, a profile outside the repository and idle timeout disabled.
- Reusable session command: npx --no-install playwright-cli -s=deutsch-hub-qa open http://localhost:5173 --persistent --profile=/tmp/deutsch-hub-playwright-cli --idle-timeout=0.
- CLI commands verified: open, snapshot, screenshot, resize, console, requests, list and session reuse across separate commands.
- CLI evidence is stored in the untracked .playwright-cli directory and is separate from historical .playwright-mcp evidence.

Authentication status:

- The CLI opened the real local application and captured the unauthenticated accessibility snapshot and screenshot.
- No fake user, credentials or Firebase configuration was used.
- No storage-state file exists in the repository or .playwright-mcp directory to transfer from the historical MCP session.
- Chrome extension attachment was unavailable because the Playwright extension is not installed.
- Chrome CDP attachment was unavailable because remote debugging is not enabled.
- Therefore authenticated Home, Learn/Library navigation and Study were not verified through CLI in this migration.

Future session policy:

- Use a named persistent CLI profile outside the repository for repeatable QA.
- If authenticated state is created, keep the profile or storage-state file outside git and never commit it.
- Use MCP only when a specific capability requires it or CLI attachment is unavailable.
- After the shell corrections, authenticated Home, Learn, Library and Profile were reached at 1440x900 and the mobile Home shell was checked at 390x844.
- After the shell corrections, the Study surface still entered focused mode with shell navigation suppressed and no horizontal overflow.
- Correction screenshots were captured as phase2-correction-home-desktop.png and phase2-correction-home-mobile.png.

## 10. Current worktree

The worktree was already dirty before the interrupted Phase 0/1 work. Do not reset, checkout, clean or overwrite it.

### Files created or changed for the current Phase 0/1 task

- New: `src/hooks/useDialogA11y.js`
- New: `src/theme/theme.js`
- New: `src/theme/theme.test.js`
- New: `src/theme/tokens.css`
- Updated: `src/main.jsx`, `src/index.css`, `src/App.jsx`
- Updated accessibility surfaces: `src/components/AITutorModal.jsx`, `src/components/BottomNav.jsx`, `src/components/SharedUI.jsx`, `src/components/CardItem.jsx`, `src/components/DeckDetail.jsx`

### Files created or changed for the Phase 2 application shell task

- New: src/components/AppShell.jsx
- New: src/components/PrimaryNavigation.jsx
- Updated: src/App.jsx, src/components/BottomNav.jsx, src/components/DeckDetail.jsx, src/index.css
- Browser evidence: .playwright-mcp/phase2-home-desktop.png, .playwright-mcp/phase2-study-focused-mobile.png, plus timestamped snapshots created by the Playwright session

### Files created or changed for the Playwright CLI migration task

- Updated: package.json, package-lock.json, AGENTS.md, HANDOFF.md
- New local QA evidence: .playwright-cli/phase-cli-unauthenticated-mobile.yml and .playwright-cli/phase-cli-unauthenticated-mobile.png, plus CLI snapshots and console logs
- No application source files were changed for this tooling migration.

### Files created or changed for the isolated QA provisioning task

- Updated: `src/firebase.js` with environment-variable overrides and production-safe fallback values.
- New, ignored local file: `.env.qa.local` containing only the QA web configuration and an empty QA AI proxy setting. Do not commit or copy its values into documentation.
- Updated: `HANDOFF.md` with the project, setup boundary, safety guarantees and pending steps.

### Files created or changed for the local QA rules task

- New: `firestore.qa.rules`.
- New: `firebase.qa.json`.
- Updated: `HANDOFF.md` with the QA authorization model, validation limitation and non-deployment status.

### Files changed before this task or overlapping earlier work

- `FEATURES.md`, `README.md`, `package.json`
- `src/App.jsx`, `src/components/AITutorModal.jsx`, `src/components/DeckDetail.jsx` already contained the earlier AI/documentation-era changes and therefore overlap the current diff.
- Existing untracked project material: `.agents/`, `.playwright-mcp/`, `AGENTS.md`, `docs/`, `src/ai/`.

`HANDOFF.md` is also updated as part of the continuity record. `AGENTS.md` was not changed during the resumed implementation/verification pass.

All of the above must be preserved until a fresh agent has inspected and separated the changes. The combined `App.jsx` diff is not evidence that App.jsx was intentionally rewritten during Phase 0/1.

## 11. Verification state

### Verified in the interrupted and resumed sessions

- Before Phase 0/1 implementation, `npm test` passed 10 existing tests.
- Before Phase 0/1 implementation, `npm run build` passed; the existing Vite bundle-size warning was present.
- After the final theme utility adjustment, `npm test` passed **17 tests** with 0 failures.
- After the final theme utility adjustment, `npm run build` passed; Vite reported the existing post-minification chunk warning above 500 kB.
- `npm run lint` reported **26 existing problems** (22 errors, 4 warnings). The categories were already present in Cloudflare `ctx`, App.jsx purity/unused/Fast Refresh issues, ExploreTab, SharedUI and TTS; no broad lint cleanup was attempted.
- `git diff --check` was clean before this handoff documentation update; it must be checked once more after this update.
- Authenticated local Home, Library, Deck Detail and Study were reached through `http://localhost:5173`.
- Study front/revealed states, keyboard Enter/Space, answer visibility, rating labels and the Tutor/Card dialog focus behavior were browser-checked.
- In the resumed pass, Goal, Import and deck-delete dialogs were checked for initial focus, focus trap, Escape, scroll lock and focus restoration.
- Theme Light/Dark selection, persistence, system resolution and reduced-motion CSS behavior were browser-checked after the final utility adjustment.
- Home, Library, Deck Detail and Study were checked at 390×844, 768×1024 and 1440×900 for horizontal overflow and required landmarks.
- Final browser console query returned 0 errors and 0 warnings. Auth and Firestore requests were observed; no AI Worker/Groq request was generated during the Home/Study/theme/dialog checks.
- Phase 2 npm test passed 17/17 after the shell wiring.
- Phase 2 npm run build passed with the existing Vite chunk-size warning.
- Phase 2 browser checks reached Home, Learn, Library, Profile and Study through the authenticated session; desktop/tablet/mobile shell visibility and no-overflow checks passed.
- Phase 2 browser console query returned 0 errors and 0 warnings.
- Playwright CLI smoke test opened localhost:5173, captured an accessibility snapshot, resized to 390x844, captured a screenshot, reported zero page console errors and listed network activity.
- Playwright CLI session persistence was verified across separate commands with a named persistent profile and idle timeout disabled.
- Playwright CLI authenticated-state reuse was not verified because no transferable MCP storage state, Chrome extension bridge or CDP endpoint was available.
- QA project creation and QA web-app registration were verified through the Firebase CLI. QA Firestore database creation was not completed because the Firestore API is disabled for the new project.
- `npm run build -- --mode qa` passed with the existing Vite chunk-size warning. The QA-mode Vite server started successfully and served localhost HTML; no authenticated browser or Firestore operation was performed.
- `firebase.qa.json` parsed successfully as JSON. The rules artifact was reviewed statically; no Firebase deployment, API enablement or Rules Simulator run was performed.

### Not verified / currently unknown

- Rating persistence remains unverified because no controlled QA account/deck was available.
- Assistive-technology/screen-reader verification was not performed.
- Full touch and zoom regression coverage remains incomplete.
- Generate/Tutor network behavior was not re-tested as part of this handoff stop. The earlier AI architecture work had its own verification record in `docs/AI_ARCHITECTURE.md` and tests.
- Firebase rules/configuration were not changed. Firestore rules/index configuration remains an external/project-console verification item.
- No claim is made that the full visual dark-mode migration or full token migration is complete; both are deferred by scope.

## 12. Browser evidence

The `.playwright-mcp/` directory contains prior authenticated audit snapshots, viewport/configuration files and current Phase 0/1 evidence. Important current-session evidence includes:

- `phase01-home-light.png`
- `phase01-home-dark.png`
- `phase01-study-front.png`
- `phase01-study-front.yml`
- `phase01-study-revealed.png`
- `phase01-study-revealed.yml`
- `phase01-tutor-dialog.png`
- `phase01-tutor-dialog.yml`
- `phase01-profile.yml`
- `phase01-resume-home.yml`
- `phase01-resume-study-front.yml`
- `phase01-resume-study-revealed.yml`

Current Phase 2 evidence also includes phase2-home-desktop.png, phase2-study-focused-mobile.png and timestamped shell/navigation and Study snapshots from the authenticated session.

There are also many timestamped Playwright page/console/network artifacts from earlier audits. Do not delete them casually; use them as evidence and distinguish old audit evidence from current Phase 0/1/2 evidence.

## 9C. Current Phase 3 Study state

**Status: implementation complete for the scoped Study redesign; browser-verified across the available authenticated session, but not human-approved automatically.**

Files changed for this phase:

- `src/App.jsx`
- `src/index.css`
- `src/components/DeckDetail.jsx`
- `src/components/AppShell.jsx`
- `HANDOFF.md`

Implemented within scope:

- Study uses a focused-mode context bar with exit action, deck/session identity and card progress.
- The normal shell header is suppressed while `srs` Study mode is active; Study owns the relevant context instead of competing with it. Quiz, Writing and Listening retain their existing focused-mode header behavior.
- Front and revealed card faces are content-led and token-backed, with German answer, grammatical identity, plural, example, translation and TTS kept in the existing data order.
- The card remains keyboard-operable with Enter and Space, keeps pointer/touch flipping, updates its accessible name and keeps unrevealed answer content hidden from the accessibility tree.
- The Phase 3 follow-up replaces the interactive card container with a semantic group and separate face-level flip buttons. Hidden faces are inert, TTS controls remain independent siblings, and focus moves to the active flip control after a reveal or reset.
- Rating labels/callbacks and `sm2` scheduling/persistence code are unchanged. Rating controls use a semantic fieldset, stable text labels and comfortable targets.
- Empty, completion and result states are explicit and preserve the existing session counts/XP semantics.
- Mobile, tablet and desktop compositions are constrained independently rather than stretching a mobile card across the workspace.
- Study-specific styling uses the existing semantic token architecture. No dependency, icon library, Firebase, Firestore, Cloudflare, AI, TTS or SRS architecture change was made.

Browser evidence captured through the authenticated existing Playwright MCP session because the persistent Playwright CLI profile is still unauthenticated:

- `.playwright-mcp/phase3-study-front-mobile.png`
- `.playwright-mcp/phase3-study-revealed-mobile-final.png`
- `.playwright-mcp/phase3-study-revealed-tablet.png`
- `.playwright-mcp/phase3-study-revealed-desktop-final.png`
- `.playwright-mcp/phase3-study-dark-desktop.png`
- `.playwright-mcp/phase3-study-dark-reduced-motion.png`
- Timestamped accessibility snapshots in `.playwright-mcp/` from the same session.

Verification recorded for this phase:

- Study front and revealed accessibility snapshots showed only the prompt before reveal and the answer after reveal.
- Enter and Space reveal behavior was verified in the accessibility snapshots. The authenticated session was not a controlled QA fixture, so rating persistence is not accepted as verified.
- Rating group and button names were present and keyboard reachable.
- 390×844, 768×1024 and 1440×900 were rendered; no horizontal overflow was observed.
- Dark theme was rendered through the existing root theme architecture.
- Reduced-motion emulation reported `0.001s` card/progress transition durations.
- Browser console query returned 0 errors and 0 warnings during the final Study pass.
- `npm test`: 17/17 passed.
- `npm run build`: passed with the existing Vite chunk-size warning above 500 kB.
- `git diff --check`: passed.
- `npm run lint`: the existing 26-problem baseline remains; no new Study-specific lint category was identified.

Verification after the Phase 3 accessibility follow-up:

- `npm test`: 17/17 passed.
- `npm run build`: passed with the existing Vite chunk-size warning above 500 kB.
- `git diff --check`: passed.
- `npm run lint`: still reports the known 26-problem baseline; no new error was attributable to the follow-up.
- No browser run was performed because the only available authenticated session is tied to real learning data and no controlled fixture exists.

Limitations and risks:

- Completion/empty states were verified by code inspection and static state handling, but the browser session did not drain a real deck because rating persistence is not a controlled QA fixture.
- During browser keyboard probing, the real session advanced five cards and the latest observed account state changed from 555 XP/60 due cards to 700 XP/55 due cards. The exact accidental rating sequence is not a controlled test fixture and must not be treated as persistence acceptance evidence. Do not use this account for future rating verification without restoring or replacing the QA data.
- A repository fixture audit found no Firebase emulator configuration, dedicated test user, seeded QA deck, mock Firebase/data adapter or deterministic browser fixture. Controlled Study persistence QA is therefore blocked until an isolated fixture is provisioned.
- The smallest recommended fixture is a separate Firebase QA project, a dedicated QA Google account, seeded due and empty decks, and a Playwright CLI profile stored outside the repository. An emulator remains an alternative, but would require explicit auth/data wiring that is not currently present.
- Screen-reader software, full zoom and independent touch-device testing remain unverified.
- The authenticated Playwright CLI profile remains unavailable; MCP was used only because it exposed the existing real authenticated session.
- The isolated QA Playwright CLI profile does not exist yet because no dedicated QA Google account has been authenticated.
- No Phase 4 Home work was started.

## 9D. Isolated QA environment state

**Status: QA project, default Firestore database and QA rules are provisioned; the project owner has manually verified Google sign-in and new-user onboarding. Returning-user CLI verification remains separate and incomplete. Production remains the default configuration when QA mode is not explicitly selected.**

Provisioned outside the production project:

- Firebase project: `deutsch-hub-qa` (`Deutsch Hub QA`).
- QA web app registered in that project.
- QA project was created separately from `deutsch-hub-ea48a`; no production data was copied or modified.
- The QA web configuration is stored in ignored `.env.qa.local` and is not committed.
- `src/firebase.js` now accepts `VITE_FIREBASE_*` overrides while preserving the existing production values as the fallback.
- QA mode explicitly clears `VITE_GROQ_PROXY_URL` so Study QA cannot accidentally call the production AI Worker.
- QA Vite mode starts with `npm run dev -- --mode qa`; the server was smoke-checked on localhost and stopped without authentication or Firestore writes.

Remaining QA setup/fixture work:

1. Ensure the dedicated QA Google account/session is available to the external Playwright profile.
2. Seed separate due-card and empty-deck fixtures using the existing application data model if Study persistence QA is resumed. No production documents should be copied.

The project owner reported and manually verified the following QA flow after creating the QA `(default)` Firestore database: Google sign-in → initial profile load → onboarding (name, CEFR level, daily goal) → Home. This report is preserved as owner-provided manual evidence; it was not reproduced by the later CLI session below.

Playwright strategy:

- Use the project-local Playwright CLI with a persistent profile outside the repository, for example `/tmp/deutsch-hub-playwright-cli-qa`.
- Authenticate that profile once through the real QA Google flow.
- Never load the prior real-user profile or commit storage state.
- Fresh Study evidence is not yet available. Persistence, completion, empty state and post-fix accessibility remain unverified until the setup is complete.

## 9E. Local QA Firestore rules state

**Status: local artifact created, version-controlled and deployed to `deutsch-hub-qa`; production rules were not copied or changed.**

Files:

- `firestore.qa.rules` — QA-only Rules v2 source.
- `firebase.qa.json` — minimal config that references only `firestore.qa.rules`; it contains no Hosting configuration.

Authorization model:

- `users`, `userLibraries`, `userGoals` and `userMissions` are owner-scoped by document UID.
- `sharedDecks` remain publicly readable by share code; creation, update and deletion are creator-scoped by `authorUid`.
- `publicDecks` remain publicly readable; creation and deletion are creator-scoped by `createdBy.uid`.
- Public import counters may update only the `imports` field by exactly `+1` and require authentication.
- The recursive fallback explicitly denies all other paths.

The production ruleset was not copied. The known leaderboard query across all `users` documents remains incompatible with owner-only user rules and will return no results under this QA policy until a public leaderboard projection exists.

Safe future deployment command, requiring an explicit QA project ID:

```text
firebase deploy --config firebase.qa.json --project deutsch-hub-qa --only firestore:rules
```

The rules were deployed by the project owner with `firebase deploy --config firebase.qa.json --project deutsch-hub-qa --only firestore:rules`; the deployment reported successful compilation and release. No production rules were changed.

## 13. Known risks before touching code

- The combined worktree contains multiple historical tasks. Inspect `git status`, diffs and canonical docs before editing.
- `App.jsx` remains a high-coupling boundary. Do not decompose it as part of finishing Phase 0/1.
- The existing app performs direct client Firestore writes and some whole-library updates; do not broaden this task into a data migration.
- Card-level delete behavior is immediate and lacks confirmation; changing it would be a separate product/accessibility decision.
- The semantic tokens are not yet the visual source of every component. Do not infer that a token file means the UI has been redesigned.
- The full dark mode is intentionally incomplete.
- The existing lint failures must not be silently attributed to this task without comparing against the recorded baseline.
- Do not submit real SRS ratings during QA unless a controlled QA account/deck is explicitly available.
- Do not expose provider errors, secrets or user data in new evidence or documentation.

## 14. Next exact step

Phase 3 Study implementation is now recorded as complete for its scoped code and browser checks, but it is not accepted until controlled persistence QA is available. The next action is to provision or explicitly approve an isolated QA fixture, then refresh the Study evidence without using the real learning account. Before any Phase 4 work, the next agent must:

1. Read this handoff, `AGENTS.md`, the relevant rules and canonical accessibility/design/architecture docs.
2. Inspect `git status` and the current diff without reverting any existing changes.
3. Inspect the Phase 3 diff and evidence against the approved Study constitution.
4. Use only the isolated QA project/account/decks and an external Playwright CLI profile to verify front, reveal, TTS, rating, persistence, next card, completion, empty state, keyboard, themes, reduced motion and console behavior.
5. Capture fresh evidence and obtain explicit human approval before starting Phase 4 Home work.

Do not start Phase 3 until the Phase 2 shell is accepted and the remaining Phase 0/1 limitations are understood.

## 15. Future implementation order

1. Phase 0 — interaction/accessibility contracts
2. Phase 1 — semantic foundation
3. Phase 2 — application shell
4. Phase 3 — Study
5. Phase 4 — Home
6. Phase 5 — Library/Deck
7. Phase 6 — Quiz/Writing/Listening
8. Phase 7 — AI/Explore/Profile
9. Phase 8 — responsive/theme refinement
10. Phase 9 — full browser QA

Each phase is incremental. Preserve the existing architecture and behavior unless the phase explicitly authorizes a change.

## 16. Fresh-agent startup protocol

Before changing anything, a fresh agent must:

1. Read `HANDOFF.md`.
2. Read `AGENTS.md`.
3. Read the relevant canonical docs under `docs/` and applicable `.agents/rules/`/skills.
4. Inspect `git status` and `git diff`.
5. Determine the actual implementation state from code and evidence.
6. Never assume planned work is implemented.
7. Continue only from the documented current phase.
8. Ask for human approval when a locked/open decision requires it.
9. Preserve the existing architecture unless the roadmap explicitly authorizes change.
10. Update `HANDOFF.md` after every meaningful implementation milestone.

## 17. Last known good state

Immediately before this handoff update:

- The repository had the Phase 0/1 files and edits listed above plus the Phase 2 shell files and edits.
- Node tests passed 17/17 after the final small theme utility adjustment.
- Vite build passed with only the known chunk-size warning after that adjustment.
- Lint still had the recorded baseline 26 problems.
- Authenticated browser checks reached Home, Learn, Library, Profile, Deck Detail and Study through the Phase 2 shell, with evidence saved under `.playwright-mcp/`.
- No Home redesign, navigation destination removal, icon-library installation or Phase 4/later roadmap work was started. The latest changes are the Phase 3 accessibility follow-up and isolated QA environment provisioning; Study persistence remains unverified.

This is the handoff boundary. The next agent must verify before claiming completion.

## 9J. Phase 3.5B popup cancellation recovery

**Status: cancellation recovery implemented and verified in the isolated QA browser; real Google sign-in was not repeated in this task.**

Root cause:

- Firebase Auth 12.12.0 detects popup cancellation by polling `popup.closed` inside its browser popup resolver.
- In the QA Chrome/Google flow, the provider document's Cross-Origin-Opener-Policy caused the browser to report `Cross-Origin-Opener-Policy policy would block the window.closed call` from the Firebase Auth bundle.
- When that observation is unavailable, the Firebase `signInWithPopup()` promise can remain pending through the normal popup lifecycle, leaving the application in `Opening Google…` while the auth service's duplicate-request promise remains active.
- The COOP message is provider/browser behavior, not an application exception. An app/Hosting COOP header was tested locally and did not remove the provider warning, so no such header was retained.

Implementation:

- `src/auth/authService.js` now keeps the duplicate-request protection but exposes `cancelGoogleSignIn()` for a deterministic user cancellation path.
- The service races the Firebase request against an explicit cancellation signal, normalizes cancellation through the existing `popup_cancelled` taxonomy and clears the active request state on every terminal path.
- `src/App.jsx` shows a small `Cancel sign-in` action only while the Google popup attempt is active. It restores the auth screen and existing safe `Sign-in was cancelled.` alert without signing out or refreshing.
- No Firebase SDK, provider, production project, Firestore rules, AI, SRS or onboarding behavior was changed.

Focused tests and verification:

- `npm test`: 32/32 passed, including popup cancellation, explicit cancellation cleanup, retry after cancellation, popup blocked normalization, generic failure normalization and concurrent-request protection.
- `npm run build`: passed with the existing Vite chunk-size warning.
- `git diff --check`: passed.
- `npm run lint`: still reports 24 repository baseline problems; no auth-service lint error was introduced.
- QA ran against `http://localhost:5176` with Firebase runtime project `deutsch-hub-qa` and the external Playwright profile `/tmp/deutsch-hub-playwright-cli-auth-fix`; no production project was used.
- Fresh QA evidence: `.playwright-cli/phase35b-qa-popup-cancellation-recovered.png` and `.playwright-cli/page-2026-09-20T21-34-10-319Z.yml`.
- The Google popup was opened, closed, the in-app cancellation action was used, the auth screen returned to an enabled `Continue with Google` state, and a subsequent click opened a new QA popup.
- Firebase's native popup path also returned the normalized cancellation after its built-in polling delay when the in-app cancel action was not used.
- Browser console still contains only the known Firebase/Google COOP warning (four occurrences across two popup attempts, no warnings or application exceptions). This provider/browser limitation remains documented and is not claimed eliminated.

Not verified in this task:

- Completing a real Google sign-in with the dedicated QA account; no credentials were entered.
- Returning-user profile detection, onboarding bypass, reload persistence, sign-out persistence or authenticated Home in this browser session.
- Popup-blocked behavior in the browser; it remains covered by unit normalization tests.

Next exact step:

- If the product requires automatic close detection with no user action, evaluate Firebase redirect-based sign-in or a supported Firebase/provider configuration separately; do not add a timer or infer popup closure from unreliable focus events. Otherwise this explicit cancellation path is the safe current QA recovery boundary.
- Do not start Email/Password, Phase 4 or Ponytail work automatically.

## 9K. Returning-user QA attempt

**Status: authenticated returning-user QA was not performed because the required dedicated profile opened signed out.**

QA environment checked:

- QA project: `deutsch-hub-qa`.
- QA Vite runtime: `http://localhost:5177`.
- Playwright profile: `/tmp/deutsch-hub-playwright-cli-qa`.
- The app loaded successfully, but the profile showed the signed-out `Continue with Google` screen rather than an authenticated Home session.
- No Google popup was opened, no credentials were entered, no sign-out was attempted and no QA data was changed.
- Evidence: `.playwright-cli/page-2026-09-21T04-10-15-262Z.yml` and `.playwright-cli/console-2026-09-21T04-10-14-916Z.log`.
- The console contained only the normal React DevTools and PWA install-banner informational messages during this attempt.

Profile-state implementation review:

- `src/auth/profileRepository.js` returns distinct `found`, `not_found` and `read_error` states.
- `src/App.jsx` maps `found` to authenticated application loading, `not_found` to onboarding, and `read_error` to `profile_load_error` with retry/sign-out controls.
- `src/auth/profileRepository.test.js` verifies all three distinctions and specifically verifies that a read failure never becomes `not_found`.

Not verified because the dedicated profile was signed out:

- Returning-user sign-in with the same QA Google account.
- Existing `users/{uid}` profile detection.
- Onboarding bypass.
- Sign-out/sign-in-again lifecycle.
- Firebase session restoration after reload.
- Authenticated Home evidence.

Checks after this QA attempt:

- `npm test`: 32/32 passed.
- `npm run build`: passed with the existing Vite chunk-size warning.
- `git diff --check`: passed.
- No application code or Firebase configuration was changed for this attempt.

Next exact step:

- Restore or re-authenticate the same dedicated QA Google account in `/tmp/deutsch-hub-playwright-cli-qa`, then run only the returning-user lifecycle requested above. Do not reopen the popup-cancellation investigation.

## 9F. Phase 3.5A auth service boundary

**Status: implemented and locally verified.** This milestone is limited to the Google authentication boundary and profile-read safety. Email/password, provider linking, persisted onboarding and completion transaction work remain deferred.

Implemented:

- `src/auth/authService.js` provides thin Google sign-in, sign-out and auth-state subscription methods.
- `src/auth/authErrors.js` normalizes popup blocked/cancelled, network, unauthorized-domain, provider-conflict, invalid-credential, too-many-request and unknown auth failures into safe application categories.
- `src/auth/profileRepository.js` distinguishes `found`, `not_found` and `read_error` profile results.
- `src/App.jsx` now keeps profile-read failures out of onboarding, exposes recoverable profile-load UI, disables duplicate Google submissions and presents safe auth errors.
- Existing Google, Firebase, Firestore, onboarding, Study, SRS, AI and QA project behavior was otherwise preserved.

Tests and verification:

- `npm test`: 26/26 passed, including auth error, auth service and profile-state tests.
- `npm run build`: passed; existing Vite chunk-size warning remains.
- `git diff --check`: passed.
- `npm run lint`: still reports the repository baseline errors; no new lint errors were reported in `src/auth/`.
- Local Playwright CLI smoke check reached the signed-out Auth screen at `http://127.0.0.1:5173`; console showed no errors or warnings. Google was not clicked because the running app used the production fallback configuration and no isolated authenticated account was used.

Not verified:

- Real Google success, popup cancellation and popup-blocked flows in the isolated QA project.
- Authenticated profile-read failure through the browser.
- Email/password, linking, verification, reset or persisted onboarding; these are not Phase 3.5A scope.

Next exact step:

- Review this Phase 3.5A boundary and, after approval, implement Phase 3.5B Google-auth hardening only. Do not begin email/password, onboarding persistence, Phase 4, or Ponytail work automatically.

## 9G. Phase 3.5B Google authentication hardening

**Status: code hardening implemented; isolated signed-out QA verified; authenticated QA blocked by Firebase Console prerequisites.**

Implemented:

- Google sign-in requests are deduplicated at the auth service boundary so concurrent calls share one popup request.
- Sign-out requests are deduplicated at the auth service boundary and guarded in `App.jsx` with an explicit `signing_out` state.
- Auth error focus returns to the Google action after a failure, while existing safe error messages and status announcements remain in place.
- Existing Firebase Auth persistence strategy was not changed; Firebase `getAuth()` default persistence remains in use.

QA verification:

- QA-mode Vite build used `.env.qa.local` and resolved the runtime Firebase Auth project ID to `deutsch-hub-qa`.
- A separate persistent Playwright CLI profile was used at `/tmp/deutsch-hub-playwright-cli-qa`.
- The signed-out Auth screen rendered at `http://127.0.0.1:5174`.
- A fresh screenshot was captured at `.playwright-cli/phase35b-qa-signed-out.png`.
- Console contained no errors or warnings; only React DevTools and the existing PWA install-banner informational messages.
- Network inspection showed only local app assets and Google Fonts. No production Firebase request occurred.

Not verified:

- Google provider enablement in `deutsch-hub-qa`.
- `localhost`/`127.0.0.1` authorized-domain configuration in the QA Firebase Console.
- Dedicated QA Google authentication.
- Successful sign-in, cancellation, popup blocking, authenticated profile loading, reload persistence or sign-out persistence.

The Firebase CLI is available, but the read-only project inspection was blocked by expired/local CLI credentials and restricted network access. Before authenticated QA, manually verify in Firebase Console:

1. `deutsch-hub-qa` → Authentication → Sign-in method → Google is enabled.
2. `deutsch-hub-qa` → Authentication → Settings → Authorized domains includes `localhost` and `127.0.0.1`.
3. A dedicated QA Google account is available.

No production Firebase configuration, production Firestore rules or QA Firestore rules were changed or deployed.

Verification:

- `npm test`: 28/28 passed.
- `npm run build`: passed with the existing Vite chunk-size warning.
- `npm run build -- --mode qa`: passed with the existing Vite chunk-size warning.
- `git diff --check`: passed.
- Full lint still reports the existing repository baseline; no new errors were reported in `src/auth/`. Exact baseline delta was not independently captured before this milestone.

Next exact step:

- Complete the three QA Firebase Console checks above, then perform authenticated Google/session-persistence QA using only the isolated account and profile. Do not implement Phase 3.5C/email authentication, onboarding persistence, Phase 4 or Ponytail automatically.

## 9H. Phase 3.5B QA verification-only pass

**Status: signed-out QA passed; authenticated QA intentionally not started.**

Pre-flight and evidence:

- `.env.qa.local` resolves to Firebase project `deutsch-hub-qa`, with `VITE_GROQ_PROXY_URL` empty.
- Firebase CLI read-only inspection confirmed the active QA web app exists in `deutsch-hub-qa`.
- QA-mode browser runtime resolved `auth.app.options.projectId` to `deutsch-hub-qa`.
- A separate persistent Playwright CLI profile was used at `/tmp/deutsch-hub-playwright-cli-qa`.
- Signed-out Auth screen rendered successfully at `http://127.0.0.1:5175`.
- Google button was present with accessible name `Continue with Google`.
- Console had no errors or warnings; only React DevTools and the existing install-banner informational messages.
- No production Firebase or Firestore requests occurred.
- Screenshot: `.playwright-cli/phase35b-qa-signed-out-verification.png`.

Authenticated QA was stopped before clicking Google because the available repository/CLI inspection could not verify:

1. Google provider enabled in the QA Firebase project.
2. `localhost` and `127.0.0.1` authorized in QA Firebase Authentication.
3. Availability of the dedicated QA Google account.

No authenticated session, QA user data, production data, Firestore rules or Firebase configuration was changed. The next agent must complete those Console checks before running Google sign-in, reload, sign-out, sign-in-again or popup-cancellation QA.

## 9I. Returning-user QA correction and current evidence

**Status: returning-user lifecycle not verified by the available CLI profile; one popup cancellation/recovery defect candidate observed.**

The project owner’s manual QA evidence establishes that the dedicated QA Google account completed the new-user flow and reached Home after the QA default Firestore database was created. This is not a claim that the current Playwright profile contains that session.

Current CLI run:

- QA Vite mode ran at `http://127.0.0.1:5176` and `http://localhost:5176`.
- Runtime Firebase project ID was verified as `deutsch-hub-qa`.
- The external profile `/tmp/deutsch-hub-playwright-cli-qa` opened signed out; it did not contain a restorable Google session.
- Attempting `127.0.0.1:5176` produced the safe `auth/unauthorized-domain` UI error, so that origin is not currently authorized for this QA flow.
- Attempting `localhost:5176` reached the Google Accounts sign-in page for `deutsch-hub-qa`. No account was selected and no credentials were entered.
- Closing the Google tab left the app in `Opening Google…` with the button disabled. The browser console showed two Firebase Auth `Cross-Origin-Opener-Policy policy would block the window.closed call` errors. This is a genuine cancellation-recovery defect candidate and was not fixed during the QA-only task.
- Network evidence contained QA Firebase/Auth endpoints only; no request targeted production `deutsch-hub-ea48a`.

Evidence:

- `.playwright-cli/phase35b-qa-signed-out-verification.png`
- `.playwright-cli/phase35b-qa-popup-cancellation-stuck.png`
- Timestamped snapshots and console logs under `.playwright-cli/` from the run.

Profile-state code verification:

- `src/auth/profileRepository.js` explicitly returns `found`, `not_found` or `read_error`.
- Existing tests verify that a read exception does not become `not_found`.
- Browser verification of an authenticated existing profile, profile read failure and onboarding bypass remains incomplete.

Repository checks after the QA run:

- `npm test`: 28/28 passed.
- `npm run build`: passed with the existing Vite chunk-size warning.
- `git diff --check`: passed.
- No application source, Firebase configuration or rules were modified during this QA run.

Next exact step:

- Make the already-used dedicated QA Google account available in the external Playwright profile, then verify returning-user sign-in, onboarding bypass, reload persistence, sign-out and sign-in again. Separately review and fix the popup cancellation stuck state only in an explicitly approved code task. Do not start Email/Password or Phase 4.

## 9J. Returning-user QA verification on QA Firebase

**Status: authenticated profile lifecycle verified; direct post-sign-in Home destination remains an observed issue.**

Environment and safety:

- QA Vite runtime: `http://localhost:5177`.
- Firebase project used: `deutsch-hub-qa` only.
- Playwright profile: `/tmp/deutsch-hub-playwright-cli-qa`.
- No production Firebase project, production users, rules or application code were modified.
- The existing QA Google browser session completed sign-in without entering credentials during this verification.

Observed results:

- The authenticated session was already on Home at the start of the run, with the persisted profile visible: Harry, A1/Anfänger, 10 XP and the A1 Starter Deck.
- Home → Learn → Library → Explore → Profile all rendered successfully. Learn currently renders the temporary Library-compatible content; this is existing behavior.
- Profile showed the persisted QA data, including Harry, the QA email, Anfänger/A1, 10 XP, 12 total cards, 12 due and 1 deck.
- Sign out returned to the Auth screen with `Continue with Google`.
- Sign in again found the existing profile and skipped onboarding. The post-auth view rendered Profile, not the Home view, because the previous navigation selection was retained. This was reproduced on a second sign-out/sign-in cycle. After selecting Home, Home rendered normally.
- Reloading while authenticated restored the existing profile and rendered Home without onboarding.

Evidence:

- Navigation snapshots: `.playwright-cli/page-2026-09-21T04-21-01-015Z.yml` (Learn), `.playwright-cli/page-2026-09-21T04-21-12-538Z.yml` (Library), `.playwright-cli/page-2026-09-21T04-21-31-558Z.yml` (Explore), `.playwright-cli/page-2026-09-21T04-21-53-565Z.yml` (Profile).
- Signed-out Auth snapshot: `.playwright-cli/page-2026-09-21T04-22-05-181Z.yml`.
- Re-authenticated existing-profile snapshot: `.playwright-cli/page-2026-09-21T04-23-28-626Z.yml` (Home after selecting Home) and `.playwright-cli/page-2026-09-21T04-28-07-805Z.yml` (direct post-auth Profile view).
- Reload-restored Home snapshot: `.playwright-cli/page-2026-09-21T04-23-40-941Z.yml`.
- Screenshots: `.playwright-cli/phase35b-returning-home-resigned-in.png` and `.playwright-cli/phase35b-returning-home-restored.png`.

Console:

- Final `console error` reported 0 errors and 0 warnings. The complete console contained only the React DevTools informational message and the existing PWA install-banner informational message.

Profile state logic remains distinct in source:

- `found` loads the profile and enters the app.
- `not_found` enters onboarding.
- `read_error` enters the profile-load error/retry state and does not enter onboarding.

Remaining lifecycle issue:

- The requested “existing user → Home” destination is not currently satisfied on sign-in when the prior in-app navigation state is Profile; the app restores Profile instead. This should be reviewed as a separate small auth/navigation-state issue before claiming the returning-user lifecycle fully complete. No fix was made during this QA-only verification.

## 9K. Re-authentication navigation-state fix

**Status: implemented and verified in the isolated QA environment.**

Root cause:

- `App.jsx` initialized `nav` to `home`, but the auth-state listener did not reset it when an authenticated Firebase user was accepted.
- Sign-out cleared profile and learning data state but retained the React `nav` state. Re-authentication therefore restored the previously selected Profile view.

Change:

- `src/App.jsx` now calls `setNav("home")` when a non-null Firebase user is received, before profile loading.
- No Firebase, Firestore, onboarding, SRS, AI, production configuration or navigation destinations were changed.

Verification:

- `npm test`: 32/32 passed.
- `npm run build`: passed; existing Vite chunk-size warning remains.
- `git diff --check`: passed.
- `npm run lint`: repository baseline remains failing with 20 errors and 4 warnings across existing files; the one-line navigation change introduced no reported lint issue.
- In QA project `deutsch-hub-qa`, Profile → sign out → Google sign in now landed directly on Home. The existing QA profile was found and onboarding was skipped.
- Authenticated reload restored Home and skipped onboarding.
- Final Playwright console inspection reported 0 errors and 0 warnings.

Fresh QA evidence:

- Profile before sign-out: `.playwright-cli/page-2026-09-21T04-33-08-267Z.yml`.
- Auth screen after sign-out: `.playwright-cli/page-2026-09-21T04-33-20-111Z.yml`.
- Home after re-authentication: `.playwright-cli/page-2026-09-21T04-33-32-257Z.yml`.
- Home after authenticated reload: `.playwright-cli/page-2026-09-21T04-33-44-394Z.yml`.

## 9L. Phase 1 token completion and shell reset

**Status: implemented and verified in the isolated QA environment. Phase 2 and later feature redesigns have not started.**

Scope completed:

- Added `lucide-react` as the approved small icon-system candidate and replaced the shell's hand-written navigation glyphs with Lucide icons. Navigation destinations and order are unchanged.
- Replaced the semantic foundation in `src/theme/tokens.css` with a warm-paper/ink light palette and layered charcoal dark palette, including semantic colors, typography roles, spacing, radius, elevation, focus and motion tokens.
- Reset the authenticated shell so the desktop rail owns the brand, the contextual header carries only page context, and the persistent global CEFR selector, XP, streak and progress bar are removed from the shell.
- Added a compact desktop rail at desktop widths and retained the mobile/tablet bottom navigation. Existing navigation remains Home, Learn, Library, Explore and Profile; Learn's temporary Library-compatible destination is unchanged.
- Added scoped legacy-utility compatibility mappings so existing feature pages can coexist with the new foundation. Feature layouts, feature-specific color treatments and product behavior remain intentionally unmigrated for later phases.
- Added a narrow dark-mode contrast correction for existing light utility surfaces. This does not redesign Home or other feature screens.

Files changed for this Phase 1 task:

- `package.json`
- `package-lock.json`
- `src/theme/tokens.css`
- `src/components/PrimaryNavigation.jsx`
- `src/index.css`
- `src/App.jsx`

Verification:

- `npm test`: 32/32 passed.
- `npm run build`: passed. The existing Vite warning about the approximately 699 kB JavaScript chunk remains.
- `npm run lint`: still fails at the known repository baseline: 20 errors and 4 warnings across existing files. No new Phase 1-specific lint issue was identified in the reported output.
- `git diff --check`: passed.
- QA runtime: `http://localhost:5177`, Firebase project `deutsch-hub-qa`, headed Playwright profile `/tmp/deutsch-hub-playwright-cli-qa`.
- Final browser console check: 0 errors and 0 warnings.
- Keyboard verification: a navigation control received a visible 3px semantic focus outline.
- Study verification: the focused Study state suppressed the normal shell and navigation; the existing Study interaction was not redesigned or submitted for rating during this task.

Fresh Phase 1 visual evidence:

- `.playwright-cli/phase1-shell-desktop-light-1440x900.png`
- `.playwright-cli/phase1-shell-desktop-dark-1440x900-final.png`
- `.playwright-cli/phase1-shell-mobile-light-390x844-final.png`
- `.playwright-cli/phase1-shell-mobile-dark-390x844-final.png`
- Existing focused Study evidence remains under `.playwright-cli/`, including `.playwright-cli/phase1-shell-study-focused.png`.

Deliberately deferred:

- Home, Learn, Study, Library, Deck Detail, Generate, Explore, Profile and onboarding redesigns.
- Full feature token migration and complete dark-mode migration.
- Any Firebase, Firestore, authentication, AI, Cloudflare, SRS or TTS changes.
- Phase 2 application-shell work and all later roadmap phases.

Next exact step: human visual review of the Phase 1 shell evidence. Do not begin Phase 2 until that review explicitly approves the foundation.

## 9M. Dark-mode hover and contrast correction

**Status: implemented and verified in the QA runtime.**

Root cause:

- Deck-detail rows use Tailwind `hover:bg-gray-50`. The earlier Phase 1 compatibility layer mapped only static `bg-gray-50`, so the hover variant still applied the light-theme color in dark mode.
- The same compatibility gap affected several existing colored hover utilities, light status surfaces, colored borders and some dark text classes used by legacy feature screens.

Change:

- `src/theme/tokens.css` now includes semantic hover, status-subtle and contrast-safe solid-action tokens.
- `src/index.css` now maps existing legacy hover/background/text/border utility variants to the dark semantic palette inside the authenticated shell. It also darkens colored action surfaces where white labels previously fell below the intended contrast threshold.
- No feature component layout, navigation, Firebase, Firestore, AI, SRS, TTS or product behavior was changed.

Browser verification, QA project `deutsch-hub-qa` only:

- Reproduced the original light hover flash on Deck Detail before the patch.
- After the patch, the hovered card row computed to `rgb(42, 47, 52)` with `rgb(241, 239, 234)` text; the light surface no longer appears.
- Checked Home, Learn/Library, Deck Detail, Explore, Profile and focused Study in dark mode at desktop and mobile widths.
- Checked Profile, status badges, Tutor action, inputs, colored learning-mode actions, card rows and mobile navigation surfaces.
- The targeted visible-element contrast scan found no below-threshold samples in the final tested Deck Detail state. This is evidence for the tested state, not a claim of full WCAG compliance.
- Focused Study remained shell-suppressed and was exited without submitting a rating or changing QA learning data.
- Final browser console: 0 errors and 0 warnings.

Evidence:

- `.playwright-cli/dark-hover-before-fix.png`
- `.playwright-cli/dark-hover-after-fix-final.png`
- `.playwright-cli/dark-home-after-fix.png`
- `.playwright-cli/dark-home-mobile-after-fix.png`
- `.playwright-cli/dark-explore-after-fix.png`
- `.playwright-cli/dark-profile-after-fix.png`
- `.playwright-cli/dark-study-final.png`

Repository verification:

- `npm test`: 32/32 passed.
- `npm run build`: passed; the existing approximately 699 kB Vite chunk warning remains.
- `git diff --check`: passed.
- `npm run lint`: existing repository baseline remains 20 errors and 4 warnings; no new issue attributable to the token/CSS correction was identified.

Remaining limitation:

- Existing feature pages intentionally retain their bright legacy color treatments until their planned feature redesign phases. This task corrected dark-mode surface/hover/contrast failures without converting those screens into the final visual system. Hidden modal/error/empty states still require dedicated browser checks during their feature migrations.

## 9N. Dark Support surface and mobile Word of the Day overflow correction

**Status: implemented and verified in the QA runtime.**

Root causes:

- The Support card header and CTA used light-theme amber/orange/rose gradient utilities that were not covered by the dark compatibility layer, leaving a pale header surface in dark mode.
- The Home Word of the Day word and `SpeakBtn` were siblings in one non-wrapping flex row. Long German compounds therefore pushed the normal-pronunciation control beyond the mobile card boundary.

Changes:

- `src/index.css` maps the existing Support header gradient to the dark semantic surface and the existing CTA gradient to the dark warm action token. Light-theme Support styling remains unchanged.
- `src/App.jsx` keeps the Word of the Day word flexible and allows the existing audio controls to move to a full-width, right-aligned row on narrow screens; the desktop inline arrangement is preserved.
- TTS behavior, Word of the Day claiming/XP behavior, Support CTA behavior, navigation, persistence and data were not changed.

QA evidence, QA project `deutsch-hub-qa` only:

- Dark Profile at 390×844: Support header computed to `rgb(23, 26, 29)` with no gradient image; the card and CTA remain within the viewport.
- Dark Home at 390×844: document `scrollWidth` was 384px for a 390px viewport, with no visible element exceeding the document width. The long `das Fingerspitzengefühl` word and both audio controls remained inside the Word of the Day card.
- Dark Home at 1440×900: the word and audio controls remained on the existing single row inside the card.
- Final visible dark-surface scan for the tested Home state found no unintended white/light surface samples.
- Final browser console: 0 errors and 0 warnings.

Evidence:

- `.playwright-cli/dark-profile-support-fixed.png`
- `.playwright-cli/dark-home-wotd-fixed-mobile.png`
- `.playwright-cli/dark-home-wotd-fixed-desktop.png`

Repository verification:

- `npm test`: 32/32 passed.
- `npm run build`: passed; the existing approximately 699 kB Vite chunk warning remains.
- `git diff --check`: passed.
- `npm run lint`: existing repository baseline remains 20 errors and 4 warnings; no new lint issue was introduced by this correction.

Remaining limitation:

- This was a targeted dark-surface and mobile-overflow correction, not a full application contrast audit or feature redesign. Other legacy feature states remain subject to their planned migration phases and dedicated QA.

## 9K. Phase Design — Iconography, Mode Hierarchy and Answer Sound Feedback

**Status: implementation complete and build-verified. Browser QA deferred (unauthenticated CLI only).**

### Files changed

- `src/App.jsx` — Lucide import block, answerFeedback wiring in QuizMode/ListeningQuiz/WritingPractice, sound toggle in StatsView settings card, Grammar/Leaderboard heading icon migration, back-button arrow migrations, Daily Missions section (MISSION_DEFS now uses Lucide Brain/BookOpen for two entries; 🔥 streak entry intentionally kept as human expression).
- `src/components/AITutorModal.jsx` — Lucide Bot/X import; replaced 🤖 and × button with Lucide; "Powered by Groq" replaced with "AI-powered explanations".
- `src/components/SharedUI.jsx` — SpeakBtn emoji (🐢, 🔈) replaced with Lucide Gauge/Volume2.
- `src/components/DeckDetail.jsx` — Full Phase 1 (Lucide) and mode-hierarchy redesign: Study as primary CTA, secondary practice row; clean icon-only buttons.
- `src/audio/answerFeedback.js` — New utility. Web Audio API tone synthesizer. No external assets, works offline/PWA. Correct = E5→G5 ascending pair; incorrect = B3 low triangle note. User-controlled ON/OFF persisted in `localStorage` under `dh_sound_feedback`. Defaults OFF. Never throws to callers.

### What changed and why

- Replaced functional-control emoji (back arrows, play buttons, mode labels) with Lucide icons throughout learning mode headers and ListeningQuiz.
- Added answer sound feedback as an opt-in, zero-dependency, offline-safe capability for Quiz, Listening and Writing modes.
- Sound toggle exposed as an accessible ARIA switch in StatsView settings card (next to Theme picker).
- No SRS behavior, Firebase, Cloudflare, AI, TTS or onboarding architecture was changed.
- Emoji intentionally kept where they serve as expressive/personality signals (streak 🔥, results 🏆/😊/💪, ✅/❌ outcome markers) per design constitution: "Lucide provides functional clarity. Emoji provides occasional human/cultural expression."

### Verification

- `npm run build`: passed; 707 kB bundle with the existing Vite chunk warning. 1956 modules transformed.
- No new lint errors introduced (did not re-run full lint; baseline was 20 errors, 4 warnings).
- No SRS/persistence/AI/auth behavior was changed.
- Browser QA not yet performed (Playwright CLI authenticated profile not established).
