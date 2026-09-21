import assert from "node:assert/strict";
import { test } from "node:test";
import { AI_CONFIG } from "./config.js";
import { AI_ERROR_CODES, AIError, normalizeProviderError } from "./errors.js";
import { createGroqProvider } from "./providers/groq.js";
import { createAIService } from "./service.js";

const validCard = {
  front: "the dog",
  back: "der Hund",
  gender: "der",
  plural: "die Hunde",
  exampleDe: "Der Hund ist groß.",
  exampleEn: "The dog is big.",
};

const validCorrection = {
  corrected: "Ich lerne Deutsch.",
  mistakes: [],
  explanation: "The sentence is correct.",
  improved: ["Ich lerne jeden Tag Deutsch."],
};

function mockProvider(result) {
  const calls = [];
  return {
    calls,
    complete: async input => {
      calls.push(input);
      if (result instanceof Error) throw result;
      return { choices: [{ message: { content: JSON.stringify(result) } }] };
    },
  };
}

test("centralizes the confirmed hosted Groq model", () => {
  assert.equal(AI_CONFIG.hosted.provider, "groq");
  assert.equal(AI_CONFIG.hosted.model, "openai/gpt-oss-20b");
});

test("Groq adapter forwards the centralized model and response format", async () => {
  let request;
  const provider = createGroqProvider({
    client: {
      chat: {
        completions: {
          create: async input => {
            request = input;
            return { choices: [{ message: { content: "ok" } }] };
          },
        },
      },
    },
  });

  const response = await provider.complete({
    messages: [],
    temperature: 0,
    responseFormat: { type: "json_object" },
  });

  assert.equal(request.model, AI_CONFIG.hosted.model);
  assert.deepEqual(request.response_format, { type: "json_object" });
  assert.equal(response.choices[0].message.content, "ok");
});

test("accepts a valid flashcard response and preserves optional fields", async () => {
  const provider = mockProvider({ cards: [{ ...validCard, note: "Animal noun", level: "A1" }] });
  const service = createAIService({ provider });
  const cards = await service.generateFlashcards({ prompt: "one animal", level: "A1" });
  assert.deepEqual(cards[0], { ...validCard, note: "Animal noun", level: "A1" });
  assert.equal(provider.calls[0].responseFormat.type, "json_object");
});

test("rejects malformed, missing-field and invalid-gender flashcard output", async () => {
  for (const response of [
    { cards: [{ ...validCard, exampleEn: 42 }] },
    { cards: [{ ...validCard, back: undefined }] },
    { cards: [{ ...validCard, gender: "noun" }] },
  ]) {
    const service = createAIService({ provider: mockProvider(response) });
    await assert.rejects(
      service.generateFlashcards({ prompt: "one word", level: "A1" }),
      error => error.code === AI_ERROR_CODES.INVALID_STRUCTURED_OUTPUT,
    );
  }
});

test("rejects an invalid provider response before it reaches application state", async () => {
  const provider = { complete: async () => ({ choices: [] }) };
  const service = createAIService({ provider });
  await assert.rejects(
    service.generateFlashcards({ prompt: "one word", level: "A1" }),
    error => error.code === AI_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
  );
});

test("rejects invalid tutor correction output", async () => {
  const service = createAIService({ provider: mockProvider({ ...validCorrection, improved: [""] }) });
  await assert.rejects(
    service.askTutor({ mode: "correct", userInput: "Ich lernen Deutsch.", level: "A1" }),
    error => error.code === AI_ERROR_CODES.INVALID_STRUCTURED_OUTPUT,
  );
});

test("normalizes provider failures into the neutral error taxonomy", () => {
  const cases = [
    [{ status: 401, message: "invalid api key" }, AI_ERROR_CODES.AUTHENTICATION],
    [{ status: 403, message: "forbidden" }, AI_ERROR_CODES.AUTHORIZATION],
    [{ status: 404, code: "model_not_found", message: "model missing" }, AI_ERROR_CODES.MODEL_NOT_FOUND],
    [{ status: 429, code: "rate_limit_exceeded", message: "slow down" }, AI_ERROR_CODES.RATE_LIMITED],
    [{ status: 504, message: "gateway timeout" }, AI_ERROR_CODES.TIMEOUT],
    [new TypeError("fetch failed"), AI_ERROR_CODES.NETWORK_FAILURE],
    [{ status: 503, message: "upstream unavailable" }, AI_ERROR_CODES.PROVIDER_UNAVAILABLE],
    [new Error("unexpected provider response"), AI_ERROR_CODES.UNKNOWN],
  ];

  for (const [input, expectedCode] of cases) {
    const normalized = normalizeProviderError(input, { provider: "groq" });
    assert.equal(normalized.code, expectedCode);
    assert.notEqual(normalized.userMessage, normalized.message);
  }
});

test("normalizes provider failure without exposing raw details as the user message", async () => {
  const providerFailure = new AIError({ code: AI_ERROR_CODES.PROVIDER_UNAVAILABLE, message: "upstream exploded" });
  const service = createAIService({ provider: mockProvider(providerFailure) });
  await assert.rejects(
    service.generateFlashcards({ prompt: "one word", level: "A1" }),
    error => error.code === AI_ERROR_CODES.PROVIDER_UNAVAILABLE && error.userMessage.includes("temporarily unavailable"),
  );
});

test("runs the existing tutor modes through the provider boundary", async () => {
  const textProvider = {
    calls: [],
    complete: async input => {
      textProvider.calls.push(input);
      return { choices: [{ message: { content: "Der Hund ist ein Haustier." } }] };
    },
  };
  const textService = createAIService({ provider: textProvider });
  const response = await textService.askTutor({ mode: "explain", word: "der Hund", level: "A1" });
  assert.equal(response, "Der Hund ist ein Haustier.");
  assert.equal(textProvider.calls[0].temperature, 0.7);
});

test("correction uses structured validation through the same provider boundary", async () => {
  const provider = mockProvider({
    ...validCorrection,
    mistakes: [{ original: "lernen", correct: "lerne", type: "conjugation", reason: "First-person present tense" }],
  });
  const service = createAIService({ provider });
  const result = await service.askTutor({ mode: "correct", userInput: "Ich lerne Deutsch.", level: "A1" });
  assert.equal(result.corrected, validCorrection.corrected);
  assert.equal(provider.calls[0].responseFormat.type, "json_object");
});
