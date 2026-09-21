# Deutsch Hub engineering constitution

Before doing project work, read `HANDOFF.md` to understand the current phase, dirty worktree, verified state and required next step. Update `HANDOFF.md` after each meaningful implementation milestone.

## Product

Deutsch Hub is a German-learning PWA for vocabulary acquisition, spaced repetition, AI-assisted card generation and tutoring, personal decks, community decks, TTS, goals and lightweight motivation. The product should feel calm, intelligent, warm, focused and intentional.

## Current technology

- React 19, Vite 8 and Tailwind CSS 3.
- Firebase Authentication with Google sign-in.
- Firestore accessed directly by the client.
- Cloudflare Worker proxying Groq requests.
- Browser Speech Synthesis for production TTS; a Vite-only Google TTS proxy exists for localhost.
- Firebase Hosting deployment with SPA rewrites.
- PWA manifest and a registered but non-caching service worker.

The current implementation is documented in `docs/ARCHITECTURE.md` and the canonical documents under `docs/`. Do not assume that feature documentation is more accurate than the code.

## Target direction

Evolve incrementally toward feature boundaries, domain services, repository adapters, scalable Firestore collections, offline-first synchronization, provider-agnostic AI, validated structured output, server-enforced quotas, robust SRS, a semantic design system, accessibility, responsive layouts and automated quality gates.

Firebase and Cloudflare remain part of the target architecture. The target is not a big-bang rewrite or a database replacement.

## Non-negotiable invariants

- Preserve existing functionality during migration.
- Inspect before changing.
- Do not perform big-bang rewrites.
- Do not invent architecture without examining the existing implementation.
- Do not directly call AI providers from feature components.
- Do not trust client-controlled quotas.
- Do not store provider secrets in Firestore.
- Do not perform whole-library writes for ordinary card updates after migration.
- Do not change SRS behavior without tests and explicit documentation.
- Do not replace Firebase, Cloudflare, authentication or the database without explicit approval.
- The historical AI incident was `llama-3.1-8b-instant → model_not_found`; the current hosted model is `openai/gpt-oss-20b` through the existing Worker. Do not change the production model as part of agent-infrastructure work; see `docs/AI_ARCHITECTURE.md` for the provider source of truth.
- Firestore rules/index configuration was not found in the inspected repository and must be verified against Firebase project configuration before database migration.
- The first audit could not perform full browser-control QA because the browser-control runtime was unavailable. Do not claim that visual browser validation has already been completed.

## Coding principles

- Prefer small, reversible changes with a clear migration seam.
- Keep UI components focused on rendering and user interaction.
- Put business rules in testable domain functions.
- Put persistence behind repositories and explicit data contracts.
- Prefer existing dependencies and browser capabilities before adding dependencies.
- Keep failures observable and user-facing without exposing secrets or raw provider internals.
- Avoid duplicate constants, duplicate feature implementations and speculative abstraction.

## UI/UX principles

- Use semantic design tokens rather than scattered visual literals.
- Establish hierarchy through typography, spacing and contrast before decoration.
- Support mobile and desktop intentionally; do not stretch a mobile shell into desktop by default.
- Support light and dark themes, keyboard use, reduced motion and assistive technology.
- Use restrained surfaces, purposeful color and meaningful motion.
- Avoid excessive gradients, glassmorphism, cards, pills, emojis, random colors, decorative animation and empty space.
- A UI task is incomplete until its important states are checked visually.

## AI principles

- Use one provider-neutral application interface.
- Centralize model and capability configuration.
- Validate every structured response before it enters domain state.
- Classify errors into user input, provider, quota, auth, transient and contract failures.
- Retry only safe transient failures; fall back only when the policy allows it.
- Keep hosted credentials server-side. BYOK credentials are user-controlled, minimized, never written to Firestore and cleared according to an explicit product policy.

## Firebase and Firestore principles

- Treat Firebase Auth as the identity boundary and Firestore rules as the data authorization boundary.
- Document and test rules before changing collections.
- Prefer per-user, per-deck and per-card documents or subcollections over large aggregate blobs.
- Use server timestamps and deterministic identifiers where synchronization matters.
- Plan migrations with dual-read/dual-write or an explicit backfill and rollback path.

## Security principles

- Never commit API keys, Worker secrets or BYOK values.
- Authenticate and authorize Worker requests before applying hosted quotas.
- Restrict proxy routes, origins, methods and payload sizes.
- Treat public decks and user text as untrusted content.
- Do not let clients mint authoritative XP, quota or leaderboard values without server validation.
- Minimize telemetry and redact prompts, tokens and personal data.

## Accessibility principles

- Use semantic HTML and accessible names for controls.
- Manage dialog focus, escape behavior and scroll locking.
- Preserve visible focus and sufficient color contrast.
- Support keyboard and touch targets.
- Announce loading, errors and important status changes.
- Test reduced motion, zoom, screen-reader labels and responsive overflow.

## Testing principles

- Test domain invariants before refactoring UI.
- Cover SRS scheduling, boundary dates, malformed AI output, provider fallback and quota behavior.
- Use Firestore emulator tests for authorization and persistence changes where appropriate.
- Use E2E tests for critical auth, generation, review, import and offline flows.
- Run lint, build, unit/integration tests and browser QA before declaring completion.
- Do not treat compilation as proof of correctness.

## Browser QA principles

Playwright CLI is the default browser QA mechanism for this repository. Use the project-local
CLI through npx --no-install playwright-cli; prefer a named persistent session and keep its
profile/storage state outside the repository. Playwright MCP is historical/non-default and should
only be used when a specific capability requires it or when CLI attachment is unavailable.

For major UI work, use:

`IMPLEMENT → RUN → RENDER → INSPECT → TEST → FIX → RENDER AGAIN`

Check responsive layouts, console errors, network failures, keyboard navigation, accessibility, loading, empty, error, offline, light and dark states. If browser control is unavailable, report the limitation and do not claim visual validation.

## Migration principles

- Establish a baseline before changing behavior.
- Prefer vertical slices that leave the app deployable.
- Add adapters around existing behavior before moving it.
- Keep old and new data paths observable during migration.
- Migrate one ownership boundary at a time.
- Remove legacy paths only after usage and rollback criteria are met.

## Prohibited patterns

- Rewriting `App.jsx` wholesale.
- Replacing Firebase or Cloudflare without approval.
- Direct Groq/Gemini/OpenRouter calls from feature UI.
- Client-only enforcement of quotas, XP or permissions.
- Unvalidated `JSON.parse` results entering application state.
- Silent swallowing of persistence or provider failures.
- New global styles that bypass design tokens.
- Adding dependencies without a documented need.
- Declaring UI work complete only because `npm run build` passes.

## Definition of done

A change is done when its scope and migration impact are documented, existing behavior is preserved or intentionally changed, relevant tests pass, lint/build pass or known failures are recorded, security and accessibility implications are reviewed, and major UI changes have browser/render evidence. The change must leave a clear rollback or follow-up path.
