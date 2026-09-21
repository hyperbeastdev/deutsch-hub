# Roadmap

## Completed baseline

- Repository constitution, rules, skills, specialized agents and current/target/open-decision documentation.
- Initial AI reliability slice: centralized model configuration, minimal Groq provider boundary, provider-neutral errors, runtime structured-output validation and mocked/provider tests.
- Hosted model replacement from the retired `llama-3.1-8b-instant` to `openai/gpt-oss-20b` through centralized configuration.

## Phase 1 — Domain seams

Extract SRS, card contracts, AI application behavior and Firestore repositories from `App.jsx` without changing user-visible behavior. Add tests before moving each boundary.

## Phase 2 — Data and synchronization

Verify deployed Firebase rules, define versioned schemas, introduce scalable repositories, then migrate personal decks and reviews with reconciliation and rollback.

## Phase 3 — Offline-first learning

Add IndexedDB cache, mutation outbox, retry behavior, conflict policy and explicit offline UI states. Offline behavior is not current functionality.

## Phase 4 — Design system and shell

Introduce semantic tokens, primitives, responsive shell, light/dark themes and accessibility foundations incrementally.

## Phase 5 — Provider expansion and community hardening

Add Gemini/OpenRouter/BYOK adapters, routing/fallback policy, server quotas, public-deck moderation and versioning. These are future phases, not current implementation.

## Phase 6 — Quality and scale

Add E2E/browser/accessibility coverage, performance budgets, observability, release checks and removal of legacy paths.

## Open sequencing decisions

- Whether domain seams or data repositories should be the next production-code slice.
- Paid/free entitlement model.
- Community moderation threshold.
- Offline conflict policy for card edits.
