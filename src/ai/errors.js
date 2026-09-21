export const AI_ERROR_CODES = Object.freeze({
  INVALID_INPUT: "invalid_input",
  CONFIGURATION: "configuration_error",
  AUTHENTICATION: "authentication_failure",
  AUTHORIZATION: "authorization_failure",
  MODEL_NOT_FOUND: "model_not_found",
  RATE_LIMITED: "rate_limited",
  TIMEOUT: "timeout",
  NETWORK_FAILURE: "network_failure",
  INVALID_PROVIDER_RESPONSE: "invalid_provider_response",
  INVALID_STRUCTURED_OUTPUT: "invalid_structured_output",
  PROVIDER_UNAVAILABLE: "provider_unavailable",
  UNKNOWN: "unknown_provider_error",
});

const USER_MESSAGES = Object.freeze({
  [AI_ERROR_CODES.INVALID_INPUT]: "Please enter a little more detail and try again.",
  [AI_ERROR_CODES.CONFIGURATION]: "AI generation is not configured yet. Please try again later.",
  [AI_ERROR_CODES.AUTHENTICATION]: "AI generation is temporarily unavailable. Please try again later.",
  [AI_ERROR_CODES.AUTHORIZATION]: "AI service access is temporarily unavailable. Please try again later.",
  [AI_ERROR_CODES.MODEL_NOT_FOUND]: "The AI model is temporarily unavailable. Please try again later.",
  [AI_ERROR_CODES.RATE_LIMITED]: "AI usage is busy right now. Please try again shortly.",
  [AI_ERROR_CODES.TIMEOUT]: "The AI request took too long. Please try again.",
  [AI_ERROR_CODES.NETWORK_FAILURE]: "The AI service could not be reached. Check your connection and try again.",
  [AI_ERROR_CODES.INVALID_PROVIDER_RESPONSE]: "The AI service returned an unexpected response. Please try again.",
  [AI_ERROR_CODES.INVALID_STRUCTURED_OUTPUT]: "The AI returned content we could not safely use. Please try again.",
  [AI_ERROR_CODES.PROVIDER_UNAVAILABLE]: "The AI service is temporarily unavailable. Please try again in a moment.",
  [AI_ERROR_CODES.UNKNOWN]: "AI generation is temporarily unavailable. Please try again in a moment.",
});

export class AIError extends Error {
  constructor({ code = AI_ERROR_CODES.UNKNOWN, message, userMessage, provider = "unknown", model, status, details, cause } = {}) {
    super(message || USER_MESSAGES[code] || USER_MESSAGES[AI_ERROR_CODES.UNKNOWN], { cause });
    this.name = "AIError";
    this.code = code;
    this.provider = provider;
    this.model = model;
    this.status = status;
    this.details = details;
    this.userMessage = userMessage || USER_MESSAGES[code] || USER_MESSAGES[AI_ERROR_CODES.UNKNOWN];
  }
}

const getProviderPayload = error => error?.error || error?.response?.data?.error || error?.response?.data || {};

export function normalizeProviderError(error, context = {}) {
  if (error instanceof AIError) return error;

  const payload = getProviderPayload(error);
  const providerCode = error?.code || payload?.code;
  const status = error?.status || error?.statusCode || error?.response?.status;
  const message = error?.message || payload?.message || "Provider request failed";
  const lowerMessage = String(message).toLowerCase();

  let code = AI_ERROR_CODES.UNKNOWN;
  if (providerCode === "model_not_found" || lowerMessage.includes("model_not_found") || lowerMessage.includes("does not exist")) {
    code = AI_ERROR_CODES.MODEL_NOT_FOUND;
  } else if (status === 401 || providerCode === "invalid_api_key") {
    code = AI_ERROR_CODES.AUTHENTICATION;
  } else if (status === 403) {
    code = AI_ERROR_CODES.AUTHORIZATION;
  } else if (status === 429 || providerCode === "rate_limit_exceeded") {
    code = AI_ERROR_CODES.RATE_LIMITED;
  } else if (status === 408 || status === 504 || error?.name === "AbortError" || lowerMessage.includes("timeout")) {
    code = AI_ERROR_CODES.TIMEOUT;
  } else if (error instanceof TypeError || lowerMessage.includes("network") || lowerMessage.includes("fetch failed")) {
    code = AI_ERROR_CODES.NETWORK_FAILURE;
  } else if (status >= 500) {
    code = AI_ERROR_CODES.PROVIDER_UNAVAILABLE;
  }

  return new AIError({
    ...context,
    code,
    message,
    status,
    details: { providerCode, payload },
    cause: error,
  });
}

export function getAIUserMessage(error) {
  if (error instanceof AIError) return error.userMessage;
  return USER_MESSAGES[AI_ERROR_CODES.UNKNOWN];
}
