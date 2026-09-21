# Architecture

## Current state

Deutsch Hub is a React 19/Vite 8 client using Tailwind CSS utilities. `src/App.jsx` still owns the application shell, authentication lifecycle, Firestore wrapper, library state, SRS, study modes, dashboard, goals, missions, profile/statistics and some tutor UI. Smaller components live under `src/components`, but several behaviors are still passed through a dependency object or remain duplicated in `App.jsx`.

The current boundaries are:

```text
React UI/components
  → App.jsx state and feature functions
  → Firebase Auth/Firestore client adapter

AI feature calls
  → src/ai/service.js
  → src/ai/providers/groq.js
  → Cloudflare Worker
  → Groq API

TTS controls
  → browser Speech Synthesis
  → Vite-only Google TTS proxy for local development
```

Firebase Auth and Firestore are initialized in `src/firebase.js` and called directly by browser code. Firebase Hosting serves `dist` with an SPA rewrite from `firebase.json`. The Cloudflare Worker forwards POST request paths and bodies to Groq with `env.GROQ_API_KEY`; it currently has wildcard CORS and no visible request authentication or server-side quota enforcement.

The PWA manifest is in `public/manifest.json`. `public/sw.js` registers successfully but does not cache resources or synchronize mutations. There is no router, TypeScript layer, repository layer, domain module, error boundary, Firestore emulator suite or browser/E2E suite. The current AI boundary has native Node tests in `src/ai/service.test.js`.

## Target state

```text
feature UI
  → application service
  → domain module
  → repository/provider adapter
  → Firebase, IndexedDB or Cloudflare
```

Suggested ownership:

- `features/` owns user-facing flows;
- `domain/` owns SRS, cards, goals and quota decisions;
- `data/` owns Firestore, IndexedDB and synchronization;
- `ai/` owns contracts, routing, providers and validation;
- `design-system/` owns semantic tokens and primitives;
- `app/` owns shell, session and navigation composition.

The target is a set of independently testable seams, not a big-bang rewrite. Firebase and Cloudflare remain adapters. Each migration should preserve the current public behavior and leave a rollback path.

## Open decisions

- Router choice, if navigation becomes URL-addressable.
- Whether server application logic belongs in Cloudflare, Firebase Functions or both.
- Whether TypeScript is introduced incrementally or at a later boundary.
- Repository and domain ownership boundaries during `App.jsx` extraction.
- Observability provider, redaction policy and retention period.
- Worker authentication and quota architecture; see [security](SECURITY.md).
