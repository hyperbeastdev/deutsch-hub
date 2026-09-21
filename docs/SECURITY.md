# Security

## Current state

Firebase configuration is embedded in the client, which is normal for Firebase web configuration but requires correct deployed rules. The Cloudflare Worker allows wildcard CORS, accepts POST requests broadly and forwards request paths/body to Groq using `env.GROQ_API_KEY`. It has no visible authentication, origin restriction, payload schema, quota enforcement or abuse controls.

The client stores generation limits and XP-related state locally before best-effort Firestore writes. These values cannot be treated as authoritative.

Firestore rules/index configuration was not found in the inspected repository and must be verified against Firebase project configuration before database migration.

## Target controls

- Verify Google/Firebase Auth and Firestore rules against least-privilege requirements.
- Authenticate Worker calls with Firebase ID tokens or an equivalent trusted session.
- Restrict Worker routes, methods, origins, body size and allowed provider operations.
- Enforce AI quotas server-side with idempotent usage records.
- Validate and moderate public deck content.
- Treat XP, streaks, imports and leaderboard values as server-trusted or explicitly abuse-tolerant.
- Keep provider secrets outside the client and Firestore.
- Never log prompts, tokens or personal data by default.
- Add security headers and a content-security policy compatible with Firebase, Worker and TTS requirements.

## Open decisions

- Worker auth mechanism and token verification library.
- Abuse-rate-limit store: Cloudflare KV, Durable Objects or another service.
- Public-deck moderation policy and reporting workflow.
- Data deletion/export commitments.
