import { AIError, AI_ERROR_CODES } from "./errors.js";

const GENDERS = new Set(["der", "die", "das", "verb"]);
const LEVELS = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);
const CORRECTION_TYPES = new Set(["capitalization", "grammar", "article", "word order", "conjugation"]);

const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);

function invalidOutput(message, details) {
  return new AIError({
    code: AI_ERROR_CODES.INVALID_STRUCTURED_OUTPUT,
    message,
    details,
  });
}

function requiredString(value, field, path) {
  if (typeof value !== "string" || !value.trim()) {
    throw invalidOutput(`Missing or invalid string at ${path}.${field}`, { path: `${path}.${field}` });
  }
  return value;
}

function requiredText(value, field, path) {
  if (typeof value !== "string") {
    throw invalidOutput(`Missing or invalid string at ${path}.${field}`, { path: `${path}.${field}` });
  }
  return value;
}

function optionalString(value, field, path) {
  if (value !== undefined && typeof value !== "string") {
    throw invalidOutput(`Invalid optional string at ${path}.${field}`, { path: `${path}.${field}` });
  }
}

export function validateFlashcardResponse(value) {
  if (!isRecord(value) || !Array.isArray(value.cards)) {
    throw invalidOutput("Flashcard response must contain a cards array", { path: "cards" });
  }

  const cards = value.cards.map((card, index) => {
    const path = `cards[${index}]`;
    if (!isRecord(card)) throw invalidOutput(`Invalid card at ${path}`, { path });

    requiredString(card.front, "front", path);
    requiredString(card.back, "back", path);
    requiredText(card.plural, "plural", path);
    requiredString(card.exampleDe, "exampleDe", path);
    requiredString(card.exampleEn, "exampleEn", path);

    if (!GENDERS.has(card.gender)) {
      throw invalidOutput(`Invalid gender at ${path}.gender`, { path: `${path}.gender`, value: card.gender });
    }
    optionalString(card.note, "note", path);
    if (card.level !== undefined && !LEVELS.has(card.level)) {
      throw invalidOutput(`Invalid level at ${path}.level`, { path: `${path}.level`, value: card.level });
    }

    return card;
  });

  return { ...value, cards };
}

export function validateTutorCorrectionResponse(value) {
  if (!isRecord(value)) throw invalidOutput("Tutor correction response must be an object", { path: "root" });

  requiredString(value.corrected, "corrected", "root");
  requiredString(value.explanation, "explanation", "root");
  if (!Array.isArray(value.mistakes)) throw invalidOutput("Tutor correction mistakes must be an array", { path: "mistakes" });
  if (!Array.isArray(value.improved)) throw invalidOutput("Tutor correction improved must be an array", { path: "improved" });

  const mistakes = value.mistakes.map((mistake, index) => {
    const path = `mistakes[${index}]`;
    if (!isRecord(mistake)) throw invalidOutput(`Invalid mistake at ${path}`, { path });
    requiredString(mistake.original, "original", path);
    requiredString(mistake.correct, "correct", path);
    requiredString(mistake.reason, "reason", path);
    if (mistake.type !== undefined && !CORRECTION_TYPES.has(mistake.type)) {
      throw invalidOutput(`Invalid correction type at ${path}.type`, { path: `${path}.type`, value: mistake.type });
    }
    return mistake;
  });

  const improved = value.improved.map((sentence, index) => {
    if (typeof sentence !== "string" || !sentence.trim()) {
      throw invalidOutput(`Invalid improved sentence at improved[${index}]`, { path: `improved[${index}]` });
    }
    return sentence;
  });

  return { ...value, mistakes, improved };
}

export function validateTextResponse(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new AIError({
      code: AI_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
      message: "Provider response did not contain text",
    });
  }
  return value;
}
