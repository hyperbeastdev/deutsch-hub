import { AI_CONFIG } from "./config.js";
import { AIError, AI_ERROR_CODES } from "./errors.js";
import { validateFlashcardResponse, validateTextResponse, validateTutorCorrectionResponse } from "./schemas.js";
import { createGroqProvider } from "./providers/groq.js";

function detectOverrideLevel(input, selectedLevel) {
  const text = (input || "").toLowerCase();
  if (text.includes("beginner") || text.includes("simple")) return "A1";
  if (text.includes("easy")) return "A2";
  if (text.includes("intermediate")) return "B1";
  if (text.includes("advanced")) return "C1";
  if (text.includes("deep") || text.includes("detailed")) return "C2";
  return selectedLevel;
}

function parseJsonCompletion(completion) {
  const content = completion?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new AIError({
      code: AI_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
      message: "Provider response did not contain a completion message",
      provider: AI_CONFIG.hosted.provider,
      model: AI_CONFIG.hosted.model,
    });
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new AIError({
      code: AI_ERROR_CODES.INVALID_STRUCTURED_OUTPUT,
      message: "Provider response was not valid JSON",
      details: { parseError: error.message },
      cause: error,
    });
  }
}

function getTextCompletion(completion) {
  return validateTextResponse(completion?.choices?.[0]?.message?.content);
}

function createFlashcardPrompt(prompt, level, existingTerms) {
  let excludeContext = "";
  if (existingTerms.length > 0) {
    const clipped = existingTerms.slice(-30).join(", ");
    excludeContext = `\nCRITICAL CONTEXT: The user already has the following terms in their deck. DO NOT generate flashcards for any of these words: ${clipped}.`;
  }

  const effectiveLevel = detectOverrideLevel(prompt, level);
  const system = `You are an expert German teacher. Create exactly what the user asks for.
The user's level is: ${effectiveLevel}
Follow CEFR guidelines strictly:
- A1: very basic explanations, simple words
- A2: simple structured sentences
- B1: moderate grammar
- B2: natural conversational tone
- C1: advanced nuance
- C2: deep linguistic explanation

${excludeContext}
  Rules:
  1. If the word is a noun, you MUST include the article in the "back" field (e.g., "der Apfel"), specify gender accurately (der, die, das), and give the plural (e.g., "die Äpfel").
  2. If it's a verb, put "verb" as gender and leave plural blank ("").
  3. Provide an illustrative example sentence in German (exampleDe) and its natural translation (exampleEn).

  You MUST output ONLY a valid JSON object matching this structure:
  {
    "cards": [
      {
        "front": "English string",
        "back": "German string with article",
        "gender": "der/die/das/verb",
        "plural": "string or empty string",
        "exampleDe": "German sentence",
        "exampleEn": "English translation"
      }
    ]
  }`;

  return { system, effectiveLevel };
}

function createCorrectionPrompt(userInput, level) {
  const effectiveLevel = detectOverrideLevel(userInput, level);
  return `You are a German language tutor.
The user's level is: ${effectiveLevel}

Follow CEFR guidelines strictly:
- A1: very basic explanations
- A2: simple structured sentences
- B1: moderate grammar
- B2: natural conversational tone
- C1: advanced nuance
- C2: deep linguistic explanation

Analyze the following sentence:
"${userInput}"

Return STRICT JSON in this format:
{
  "corrected": "...",
  "mistakes": [
    {
      "original": "...",
      "correct": "...",
      "type": "capitalization | grammar | article | word order | conjugation",
      "reason": "..."
    }
  ],
  "explanation": "...",
  "improved": ["...", "..."]
}

Rules:
- Identify ALL mistakes, not just one.
- Keep explanation simple and appropriate for ${effectiveLevel} level.
- Be precise
- Improved must contain REAL alternative sentences (not meta text).
- Do not add extra text outside JSON`;
}

export function createAIService({ provider = createGroqProvider() } = {}) {
  return {
    async generateFlashcards({ prompt, level, existingTerms = [] }) {
      if (!prompt?.trim()) {
        throw new AIError({ code: AI_ERROR_CODES.INVALID_INPUT, message: "Flashcard prompt is empty" });
      }

      const { system } = createFlashcardPrompt(prompt, level, existingTerms);
      const completion = await provider.complete({
        messages: [{ role: "system", content: system }, { role: "user", content: `Task: ${prompt}` }],
        temperature: 0.5,
        responseFormat: { type: "json_object" },
      });
      return validateFlashcardResponse(parseJsonCompletion(completion)).cards;
    },

    async askTutor({ mode, word, userInput, level }) {
      if (mode === "correct") {
        if (!userInput?.trim()) throw new AIError({ code: AI_ERROR_CODES.INVALID_INPUT, message: "Correction input is empty" });
        const completion = await provider.complete({
          messages: [{ role: "user", content: createCorrectionPrompt(userInput, level) }],
          temperature: 0.5,
          responseFormat: { type: "json_object" },
        });
        return validateTutorCorrectionResponse(parseJsonCompletion(completion));
      }

      const effectiveLevel = detectOverrideLevel(userInput, level);
      const prompts = {
        explain: `You are a German language tutor. The user's level is: ${effectiveLevel}
Follow CEFR guidelines strictly for vocabulary and explanation depth:
- A1: very basic explanations
- A2: simple structured sentences
- B1: moderate grammar
- B2: natural conversational tone
- C1: advanced nuance
- C2: deep linguistic explanation

Explain the German word "${word}". Include: gender (if noun), plural form, 2-3 example sentences, common usage tips, and any tricky grammar. Keep it friendly and clear. Respond in plain text (no JSON).`,
        sentences: `You are a German language tutor. The user's level is: ${effectiveLevel}
Generate 5 natural, varied German example sentences using the word "${word}". For each sentence, give the German and then the English translation. Format each as:\n1. [German sentence]\n   → [English translation]`,
      };

      if (!prompts[mode]) throw new AIError({ code: AI_ERROR_CODES.INVALID_INPUT, message: `Unsupported tutor mode: ${mode}` });

      const completion = await provider.complete({
        messages: [{ role: "user", content: prompts[mode] }],
        temperature: 0.7,
      });
      return getTextCompletion(completion);
    },
  };
}

const defaultAIService = createAIService();

export function generateAIFlashcards(prompt, level, existingTerms = []) {
  return defaultAIService.generateFlashcards({ prompt, level, existingTerms });
}

export function generateAITutorResponse(mode, word, userInput, level) {
  return defaultAIService.askTutor({ mode, word, userInput, level });
}
