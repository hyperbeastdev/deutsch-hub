# Performance

## Current state

The current production build emits one JavaScript chunk of approximately 682.3 kB minified and 203.5 kB gzip; Vite reports a chunk-size warning above 500 kB. Feature areas and the provider SDK are eagerly bundled. The app also performs render-time randomization in study modes and uses large aggregate Firestore writes for library changes.

Community deck listing can load full card payloads for up to 50 public documents. There is no asset cache, offline data cache or synchronization queue. Browser Speech Synthesis is the normal TTS path; a local-only Google TTS proxy exists during Vite development.

## Target budgets and practices

- Lazy-load feature areas and heavy provider/UI code.
- Set an initial-route JavaScript budget and measure it in CI.
- Avoid unnecessary rerenders and impure render-time work.
- Write only changed deck/card documents after the data migration.
- Paginate community content and avoid full card bodies in list views.
- Cache static assets and learning data intentionally.
- Use IndexedDB for offline decks/reviews and reconcile through an outbox.
- Measure Core Web Vitals on representative mobile devices.
- Measure review interaction latency, Firestore read/write volume, offline queue size and TTS start latency.

## Open decisions

- Initial performance budget by route.
- Code-splitting boundaries and cache retention/eviction policy.
- Whether audio is cached locally or generated on demand.
- Performance telemetry provider and privacy limits.
