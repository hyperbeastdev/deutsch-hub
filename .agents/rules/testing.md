# Testing rule

- Add tests for domain behavior before changing its implementation.
- SRS tests must cover ratings, intervals, failures, weak-card routing, date boundaries and legacy records.
- AI tests must cover schemas, malformed JSON, provider errors, retry/fallback policy and quota decisions without requiring live providers.
- Use Firestore emulator tests for rules and repository behavior when persistence changes.
- Use E2E/browser tests for authentication, generation, review, community import and offline recovery.
- Include accessibility checks and responsive state checks for major UI work.
- Run lint and build, and report known baseline failures rather than hiding them.
