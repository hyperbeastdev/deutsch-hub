# AI architecture

## Current state

The first reliability boundary is implemented without redesigning the UI or Cloudflare Worker. Feature code uses the application-level functions in `src/ai/service.js`; feature components do not import the Groq SDK directly.

Current files:

- `src/ai/config.js` — centralized hosted provider/model/proxy configuration;
- `src/ai/errors.js` — provider-neutral error codes, normalization and safe user messages;
- `src/ai/schemas.js` — runtime validation for flashcards, tutor corrections and text completions;
- `src/ai/service.js` — prompts, task-level service methods and compatibility wrappers;
- `src/ai/providers/groq.js` — the current Groq SDK adapter;
- `src/ai/service.test.js` — native Node mocked/provider smoke tests.

The hosted provider is Groq through the existing Cloudflare Worker. The active model is `openai/gpt-oss-20b`. The retired `llama-3.1-8b-instant` appears only as historical context: the deployed Worker returned `model_not_found` for it, while the confirmed model returned a successful response through the same path.

The service currently covers:

- `flashcard.generate` with JSON object output;
- `tutor.explain` with plain text;
- `tutor.sentences` with plain text;
- `tutor.correct` with validated JSON output.

Flashcards validate `front`, `back`, `gender`, `plural`, `exampleDe` and `exampleEn`, with optional `note` and CEFR `level`. Tutor correction validates `corrected`, `mistakes`, `explanation` and `improved`. Provider failures are normalized into authentication, authorization, model-not-found, rate-limit, timeout, network, invalid-response, invalid-structured-output, unavailable and unknown categories. Technical details remain on the error object; normal UI messages do not expose raw provider JSON.

The Worker itself was not redesigned in the reliability slice. Its current behavior is a broad POST proxy with wildcard CORS, request-body forwarding and the server-side `GROQ_API_KEY`. Authentication, payload validation and server-enforced quotas remain open security work.

## Target state

```text
feature
  → AI application service
  → versioned task contract and policy
  → provider router
  → Groq / Gemini / OpenRouter / BYOK adapter
  → Cloudflare gateway where hosted credentials are used
```

Future task policies should select a compatible model/provider, validate inputs and outputs, apply bounded retry rules and emit redacted diagnostics. Hosted free usage must be decided at an authenticated server boundary. BYOK values must remain user-owned, short-lived where possible, unlogged and outside Firestore.

## Intentionally deferred

- Gemini adapter;
- OpenRouter adapter;
- BYOK support;
- automatic multi-provider fallback;
- server-enforced hosted quotas;
- Cloudflare Worker authentication, route restriction and gateway redesign;
- shared versioned schemas between the client and Worker.

## Open decisions

- Future task-to-model capability policy and provider order.
- Firebase ID-token verification location for the Worker.
- Whether BYOK calls go direct from the browser or through an ephemeral gateway.
- Schema library and schema sharing strategy.
- Prompt/version telemetry and redaction policy.
