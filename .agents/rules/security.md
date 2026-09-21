# Security rule

- Treat all client input, generated content and community decks as untrusted.
- Keep Groq, Gemini, OpenRouter and Worker secrets outside the client bundle and Firestore.
- The Cloudflare Worker must authenticate requests, restrict routes/methods/origins, validate payloads and enforce quotas before production hardening is complete.
- Firebase Auth identity does not replace Firestore authorization rules; both must be reviewed.
- XP, quota, import counters and leaderboard values require server-trusted validation or explicit abuse tolerance.
- Public deck reads/writes must follow least privilege, ownership and moderation rules.
- Redact prompts, tokens, personal data and provider responses from logs unless specifically required and protected.
