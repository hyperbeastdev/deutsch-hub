const AUTH_ERROR_DEFINITIONS = {
  "auth/popup-blocked": {
    code: "popup_blocked",
    message: "Your browser blocked the sign-in window. Allow pop-ups and try again.",
    retryable: true,
  },
  "auth/popup-closed-by-user": {
    code: "popup_cancelled",
    message: "Sign-in was cancelled.",
    retryable: true,
  },
  "auth/cancelled-popup-request": {
    code: "popup_cancelled",
    message: "Sign-in was cancelled.",
    retryable: true,
  },
  "auth/network-request-failed": {
    code: "network_failure",
    message: "We couldn't reach the sign-in service. Check your connection and try again.",
    retryable: true,
  },
  "auth/unauthorized-domain": {
    code: "unauthorized_domain",
    message: "This sign-in page isn't authorized for this Firebase project.",
    retryable: false,
  },
  "auth/account-exists-with-different-credential": {
    code: "provider_conflict",
    message: "An account already exists with a different sign-in method. Use that method to continue.",
    retryable: true,
  },
  "auth/invalid-credential": {
    code: "invalid_credential",
    message: "That sign-in credential is no longer valid. Please try again.",
    retryable: true,
  },
  "auth/too-many-requests": {
    code: "too_many_requests",
    message: "There have been too many sign-in attempts. Please wait a moment and try again.",
    retryable: true,
  },
};

const UNKNOWN_AUTH_ERROR = {
  code: "unknown_auth_error",
  message: "Something went wrong while signing you in. Please try again.",
  retryable: true,
};

export function normalizeAuthError(error) {
  if (error?.name === "AuthError" && error.code && error.message) return error;

  const definition = AUTH_ERROR_DEFINITIONS[error?.code] || UNKNOWN_AUTH_ERROR;
  const normalized = new Error(definition.message);
  normalized.name = "AuthError";
  normalized.code = definition.code;
  normalized.message = definition.message;
  normalized.retryable = definition.retryable;
  normalized.cause = error;
  return normalized;
}

export const AUTH_ERROR_CODES = Object.freeze({
  POPUP_BLOCKED: "popup_blocked",
  POPUP_CANCELLED: "popup_cancelled",
  NETWORK_FAILURE: "network_failure",
  UNAUTHORIZED_DOMAIN: "unauthorized_domain",
  PROVIDER_CONFLICT: "provider_conflict",
  INVALID_CREDENTIAL: "invalid_credential",
  TOO_MANY_REQUESTS: "too_many_requests",
  UNKNOWN: "unknown_auth_error",
});
