import assert from "node:assert/strict";
import { test } from "node:test";
import { AUTH_ERROR_CODES, normalizeAuthError } from "./authErrors.js";

const cases = [
  ["auth/popup-blocked", AUTH_ERROR_CODES.POPUP_BLOCKED],
  ["auth/popup-closed-by-user", AUTH_ERROR_CODES.POPUP_CANCELLED],
  ["auth/network-request-failed", AUTH_ERROR_CODES.NETWORK_FAILURE],
  ["auth/unauthorized-domain", AUTH_ERROR_CODES.UNAUTHORIZED_DOMAIN],
  ["auth/account-exists-with-different-credential", AUTH_ERROR_CODES.PROVIDER_CONFLICT],
  ["auth/invalid-credential", AUTH_ERROR_CODES.INVALID_CREDENTIAL],
  ["auth/too-many-requests", AUTH_ERROR_CODES.TOO_MANY_REQUESTS],
];

test("normalizes known Firebase auth errors without exposing raw messages", () => {
  for (const [firebaseCode, expectedCode] of cases) {
    const normalized = normalizeAuthError({ code: firebaseCode, message: "internal Firebase detail" });
    assert.equal(normalized.name, "AuthError");
    assert.equal(normalized.code, expectedCode);
    assert.notEqual(normalized.message, "internal Firebase detail");
    assert.equal(typeof normalized.retryable, "boolean");
  }
});

test("normalizes unknown auth errors into a safe retryable error", () => {
  const normalized = normalizeAuthError(new Error("private implementation detail"));
  assert.equal(normalized.code, AUTH_ERROR_CODES.UNKNOWN);
  assert.equal(normalized.message, "Something went wrong while signing you in. Please try again.");
  assert.equal(normalized.retryable, true);
});
