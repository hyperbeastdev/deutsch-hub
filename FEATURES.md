# Deutsch Hub feature inventory

This file is preserved as a compact inventory of product areas from the original feature guide. It is not a second architecture or product source of truth. Current product behavior belongs in [docs/PRODUCT.md](docs/PRODUCT.md); implementation boundaries belong in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/AI_ARCHITECTURE.md](docs/AI_ARCHITECTURE.md) and [docs/DATA_MODEL.md](docs/DATA_MODEL.md).

## Current implementation

- **Authentication and onboarding:** Google sign-in, first-use name/CEFR/daily-goal onboarding and sign-out. The former feature guide described a demo mode, but the current demo handler is a no-op and there is no usable demo flow.
- **Personal learning library:** A starter deck, custom decks, manual card creation/editing/deletion, mnemonic notes and CEFR levels.
- **Private sharing:** Six-character share codes backed by `sharedDecks/{code}`; imported cards receive independent local IDs and review state.
- **Community Explore:** Authenticated users can publish a cleaned copy to `publicDecks`, search/filter public decks and import an independent copy. SRS metadata is stripped from published cards. Moderation is not implemented.
- **AI cards:** Global generation, text-list import and deck-level AI additions. The deck-level flow excludes up to 30 existing terms from its prompt. The hosted path is Groq through the Cloudflare Worker, using `openai/gpt-oss-20b`.
- **AI tutor:** Explain a word, generate example sentences and correct a learner sentence. Structured flashcard and correction responses are validated before use.
- **Review and study modes:** SRS review with Again/Hard/Good/Easy ratings, multiple-choice quiz, writing practice and listening quiz.
- **SRS behavior:** The current scheduler is an SM-2-inspired function with ease factor, intervals, repetitions, due timestamps, failure counts and confidence scores. Weak cards are prioritized in a review session when confidence is below 40% or failure count is at least 3.
- **Language support:** Browser German speech synthesis for cards and examples, grammar reference content by CEFR level, and Word of the Day.
- **Motivation and goals:** Daily card progress, XP, badges, streak history, daily missions, learning paths with target level/timeframe, profile statistics and a top-ten XP leaderboard.
- **PWA shell:** Web app manifest, install prompt handling and service-worker registration. The service worker does not cache assets or provide offline synchronization.

## Documented or planned behavior

The original guide used aspirational language for “real-time sync,” “demo mode,” “premium” AI behavior and native-app equivalence. Those claims are not current implementation guarantees. Firestore persistence is direct client reads and writes, often as aggregate documents; it is not implemented with realtime listeners or an offline mutation queue.

Future provider expansion, automatic AI fallback, server-enforced quotas, scalable Firestore collections, offline-first learning, moderation and the complete design system are tracked in [docs/ROADMAP.md](docs/ROADMAP.md) and the relevant canonical documents.
