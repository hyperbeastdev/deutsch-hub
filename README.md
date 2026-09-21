# 🇩🇪 Deutsch Hub

Deutsch Hub is a React/Vite German-learning PWA for vocabulary acquisition, spaced-repetition review, AI-assisted card generation and tutoring, personal decks, community decks, browser TTS, goals and lightweight motivation.

The product is functional and incrementally evolving. Firebase remains the authentication and Firestore platform, and a Cloudflare Worker remains the hosted Groq gateway. The current hosted AI model is `openai/gpt-oss-20b`.

## Current capabilities

- Google sign-in, onboarding and cross-session Firestore persistence.
- Personal decks with manual editing, notes, private share codes and public community publishing/import.
- AI flashcard generation, text-list import and tutor explanation, sentence and correction modes.
- Four learning modes: SRS review, multiple-choice quiz, writing practice and listening quiz.
- German browser speech synthesis, grammar reference, word of the day, goals, missions, XP, streaks, badges and leaderboard.
- Installable PWA shell through `public/manifest.json` and a registered service worker. Offline caching and synchronization are not implemented yet.

## Technology

- React 19, Vite 8 and Tailwind CSS 3.
- Firebase Authentication with Google sign-in and Cloud Firestore.
- Cloudflare Worker proxying hosted Groq requests; the Groq key stays server-side.
- Browser Speech Synthesis, with a Vite-only Google TTS proxy for local development.
- Native Node test runner for the current AI boundary tests.

## Local development

Install the existing dependencies, create a local `.env` file, and set:

```text
VITE_GROQ_PROXY_URL=https://<your-deployed-worker>
```

Do not commit `.env` files or provider secrets. Firebase web configuration is currently defined in `src/firebase.js`; verify the intended Firebase project before connecting a local build.

Available scripts:

```bash
npm run dev
npm test
npm run lint
npm run build
npm run preview
```

The repository currently has known baseline lint findings outside the AI boundary. See the architecture and decision documents before treating lint as a clean quality gate.

## Deployment

Firebase Hosting serves `dist` according to `firebase.json` and rewrites application routes to `index.html`. The hosted AI path is the separately configured Cloudflare Worker under `cloudflare-proxy/`. Deployment credentials and the exact release workflow are not encoded as package scripts.

## Documentation

- [Product definition](docs/PRODUCT.md)
- [Technical architecture](docs/ARCHITECTURE.md)
- [AI architecture](docs/AI_ARCHITECTURE.md)
- [Firestore data model](docs/DATA_MODEL.md)
- [Design brief](docs/DESIGN_BRIEF.md) and [design system](docs/DESIGN_SYSTEM.md)
- [Accessibility](docs/ACCESSIBILITY.md), [security](docs/SECURITY.md) and [performance](docs/PERFORMANCE.md)
- [Roadmap](docs/ROADMAP.md) and [architecture decisions](docs/DECISIONS.md)
- [Legacy feature inventory](FEATURES.md)

Engineering constraints and non-negotiable project rules live in [AGENTS.md](AGENTS.md). Reusable procedures and role guidance live under `.agents/`.
