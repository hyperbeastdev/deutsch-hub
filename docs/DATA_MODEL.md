# Data model

## Current state

Firestore is accessed directly from browser code through the `DB` object in `src/App.jsx`. The repository does not contain Firestore rules or index configuration; deployed Firebase configuration must be verified separately.

Current collections and documents are:

- `users/{uid}` — profile identity, CEFR `level`, daily `goal`, `xp`, `streak`, study `history`, and client-side generation fields such as `lastGenDate`/`dailyGens` when present. Leaderboard reads query this collection by `xp`.
- `userLibraries/{uid}` — one aggregate document containing a `decks` array. Decks contain IDs, names, levels, creation timestamps and card arrays. Cards contain learning fields such as `front`, `back`, `gender`, `plural`, examples, notes, `ef`, `interval`, `reps`, `due`, `lastRating`, `failureCount` and `confidenceScore` when present.
- `sharedDecks/{code}` — six-character private share code, deck name/level, author UID, creation timestamp, download counter and cleaned card payload.
- `userGoals/{uid}` — target level, timeframe, daily new-card/review targets, start date, completed days and UID.
- `userMissions/{uid}` — current date and mission state entries containing IDs and claim state.
- `publicDecks/{deckId}` — public deck metadata, cleaned cards, creation data, author display data, original deck ID, import/like counters and tags.

The client often replaces the entire `userLibraries/{uid}` aggregate after a deck or card update. Public deck listing reads up to 50 documents ordered by `imports`. Public publishing strips SRS fields, and public import creates independent card/deck IDs and review defaults. Firestore realtime listeners and an offline mutation queue are not implemented.

## Target state

A candidate scalable shape is:

```text
users/{uid}
userDecks/{uid}/decks/{deckId}
userDecks/{uid}/decks/{deckId}/cards/{cardId}
userDecks/{uid}/decks/{deckId}/reviews/{reviewId}
publicDecks/{deckId}
publicDecks/{deckId}/versions/{versionId}
goals/{uid}
dailyStats/{uid}/{date}
```

Ordinary card updates should become narrow writes. Review events should be durable enough to rebuild progress and diagnose SRS changes. Offline work should add an IndexedDB cache and mutation outbox with explicit conflict handling.

## Migration approach

1. Verify deployed rules, indexes, document sizes and real data.
2. Define versioned card/deck schemas and compatibility readers.
3. Add repository adapters without changing UI behavior.
4. Dual-read or backfill with reconciliation and rollback support.
5. Switch one feature at a time.
6. Remove aggregate writes only after evidence supports it.

## Open decisions

- Whether user-owned decks are top-level or nested under user documents.
- Review-event retention and aggregation strategy.
- Public deck versioning, moderation state and deletion policy.
- Conflict resolution for simultaneous offline edits.
- Trusted-server ownership of XP, quotas, imports and leaderboard values.
