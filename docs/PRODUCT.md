# Product

## Product definition

Deutsch Hub helps people learn German vocabulary and usage through short, repeatable study sessions. The primary user is a German learner working at CEFR levels A1–C2 who wants personal vocabulary, guided review and useful corrective feedback.

The product should feel calm, intelligent, warm, focused and intentional. Learning actions should be obvious, feedback should be useful, and motivation should support learning rather than compete with it.

## Current implementation

- **Authentication and onboarding:** Google sign-in, first-use name/CEFR/daily-goal onboarding and sign-out. There is no working demo mode; the old demo callback is a no-op.
- **Personal library:** A starter deck plus custom decks, manual card creation/editing/deletion, mnemonic notes and CEFR levels.
- **Private sharing:** Six-character share codes create an independent imported deck.
- **Community decks:** Explore loads public decks, supports name/level filtering and imports independent copies. Publishing strips SRS fields. Moderation and versioning are not implemented.
- **AI learning tools:** Global card generation, text-list import, deck-level additions, tutor explanations, example sentences and sentence correction. See [AI architecture](AI_ARCHITECTURE.md) for provider and validation details.
- **Study modes:** SRS review, multiple-choice quiz, writing practice and listening quiz.
- **Review behavior:** The current scheduler is an SM-2-inspired implementation with ease factor, repetitions, intervals, due timestamps, failure counts and confidence scores. Weak cards are prioritized when confidence is below 40% or failure count is at least 3.
- **Language support:** Browser German speech synthesis, grammar references by CEFR level and Word of the Day.
- **Motivation:** Daily progress, XP, badges, streak history, daily missions, learning paths with target level/timeframe, profile statistics and a top-ten XP leaderboard.
- **Persistence and installability:** Firebase Auth/Firestore persistence, a web app manifest, install prompt handling and a registered non-caching service worker. Firestore is accessed by direct client reads/writes; realtime listeners and offline synchronization are not implemented.

## Target experience

Deutsch Hub should evolve into a production-quality language-learning PWA with reliable review, transparent progress, scalable personal/community decks, offline-first study, provider-agnostic AI, controlled hosted usage, dependable TTS, responsive mobile/desktop layouts, light/dark themes, accessibility and measurable performance.

The target is an incremental evolution of the existing product. Firebase and Cloudflare remain part of the platform; a rewrite or replacement is not part of the product direction.

## Open product decisions

- Whether the primary loop is review-first, lesson-first or a hybrid.
- Which capabilities are free, account-gated or paid.
- Whether public decks require moderation before publication and how reports are handled.
- The long-term role of XP, streaks and leaderboard competition.
- Whether hosted TTS is needed beyond browser speech synthesis.
- The minimum deck/card quality bar for community discovery.
