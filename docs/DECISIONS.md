# Architecture decisions

## AD-001 — Preserve Firebase and Cloudflare

**Status:** accepted baseline

Firebase remains the identity and cloud-data platform. Cloudflare remains the hosted AI gateway. Future work must improve boundaries around them instead of replacing them without explicit approval.

## AD-002 — Migrate incrementally

**Status:** accepted baseline

No big-bang rewrite. New seams, adapters and tests precede movement of behavior. Existing functionality must remain available during migration.

## AD-003 — AI provider neutrality is a boundary

**Status:** initial boundary implemented; full provider router deferred

Feature components use an application-level AI service and do not call provider SDKs directly. The current boundary owns prompts, validation and normalized errors for Groq. Routing, fallback, quotas and additional providers remain future work.

## AD-004 — The original Groq failure was model availability

**Status:** confirmed and resolved by the AI reliability slice

The deployed Worker returned `model_not_found` for `llama-3.1-8b-instant`. The same Worker returned HTTP 200 for `openai/gpt-oss-20b`. The active model was changed through centralized configuration in `src/ai/config.js`; the old model remains documented only as historical context.

## AD-005 — Firestore rules must be verified before migration

**Status:** open verification

Firestore rules/index configuration was not found in the inspected repository. Deployed rules, indexes, document sizes and real data must be verified before changing the data model. No claim is made about deployed rules from repository absence alone.

## AD-006 — Browser validation remains outstanding

**Status:** open verification

The available browser-control runtime had no connected browser during the audit and AI reliability task. Major UI work must include browser evidence when the runtime is available.

## AD-007 — Establish a minimal AI boundary before provider expansion

**Status:** implemented

AI configuration, Groq transport, provider-neutral errors, response validation and application-level AI services now live under `src/ai`. The boundary intentionally has one active provider and no automatic fallback. It preserves the existing Generate, Tutor and Correction flows while making future adapters possible.

Gemini, OpenRouter, BYOK and automatic fallback have not been implemented.

## AD-008 — One source of truth per documentation type

**Status:** implemented by documentation consolidation

`AGENTS.md` contains project-wide constraints, `README.md` is the public setup/introduction, and each file under `docs/` owns one knowledge category. `FEATURES.md` is preserved as a compact legacy feature inventory and points to the canonical product and architecture documents; it is not treated as a competing source of truth.

## Open decisions

- Exact scalable Firestore collection layout and migration path.
- Worker authentication and server quota store.
- Future task-to-model policy and provider order.
- BYOK lifetime and transport.
- Design token values, theme persistence and desktop shell.
- Browser/E2E test framework and supported browser matrix.
