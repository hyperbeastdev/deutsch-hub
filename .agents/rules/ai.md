# AI rule

- Feature components call an application-level AI service, never Groq, Gemini or OpenRouter directly.
- Keep provider adapters behind a provider-neutral contract with centralized model/capability configuration.
- Validate structured output against explicit schemas before persistence or rendering.
- Normalize provider failures into stable application errors.
- Retry only bounded, safe transient failures; fall back only for policy-approved provider/model failures.
- Enforce hosted quotas server-side. Client counters are hints only.
- BYOK values are user-owned, short-lived where possible, never stored in Firestore, never logged and never sent to an unrelated provider.
