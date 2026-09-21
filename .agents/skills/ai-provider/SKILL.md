---
name: ai-provider
description: Design or implement Deutsch Hub AI integrations behind provider-neutral contracts with schemas, routing, fallback, quotas and BYOK safety.
---

# AI provider architecture

Use this skill for Groq, Gemini, OpenRouter, BYOK, model configuration, structured AI output, provider fallback or AI quota work.

## Boundary

Feature components must call an application AI service. The service selects a task policy and invokes provider adapters. Provider SDKs and HTTP details stay inside adapters or the Cloudflare gateway.

## Contracts

Define explicit task contracts for flashcard generation, tutor explanation, sentence generation and correction. Keep input and output schemas versioned. Validate every structured response before it reaches deck or tutor state; malformed output is a contract error, not a successful empty result.

## Routing

Centralize provider/model capability configuration. Route by task, user entitlement, configured BYOK provider and provider health. Retry only bounded transient errors. Fallback only for policy-approved model-not-found, rate-limit or provider-availability failures; do not retry malformed user input.

## Quotas

Hosted free usage must be enforced at an authenticated server boundary. Client counters may render status but cannot authorize usage. Quota decisions should be idempotent, auditable and independent of mutable client state.

## BYOK

BYOK keys are user-owned secrets. Minimize their lifetime and scope, avoid persistence by default, never write them to Firestore or logs, and make the active provider visible to the user. Do not silently forward a BYOK key to another provider or fallback path.

## Verification

Test adapters with mocked provider responses. Test schema rejection, normalized errors, retry/fallback policy and quota boundaries without live calls. Keep a separate opt-in smoke test for deployed provider connectivity.
