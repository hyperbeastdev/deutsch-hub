import assert from "node:assert/strict";
import { test } from "node:test";
import { AUTH_ERROR_CODES } from "./authErrors.js";
import { createAuthService } from "./authService.js";

function serviceWith(overrides = {}) {
  return createAuthService({
    auth: { currentUser: null },
    googleProvider: { providerId: "google.com" },
    ...overrides,
  });
}

test("Google sign-in delegates to Firebase", async () => {
  const calls = [];
  const result = { user: { uid: "qa-user" } };
  const service = serviceWith({
    signInWithPopup: async (...args) => {
      calls.push(args);
      return result;
    },
  });

  assert.equal(await service.signInWithGoogle(), result);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1].providerId, "google.com");
});

test("Google sign-in normalizes Firebase failures", async () => {
  const service = serviceWith({
    signInWithPopup: async () => {
      throw { code: "auth/popup-blocked", message: "raw detail" };
    },
  });

  await assert.rejects(service.signInWithGoogle(), error => (
    error.code === AUTH_ERROR_CODES.POPUP_BLOCKED
    && error.message !== "raw detail"
  ));
});

test("Google sign-in normalizes popup cancellation", async () => {
  const service = serviceWith({
    signInWithPopup: async () => {
      throw { code: "auth/popup-closed-by-user", message: "popup closed" };
    },
  });

  await assert.rejects(service.signInWithGoogle(), error => (
    error.code === AUTH_ERROR_CODES.POPUP_CANCELLED
    && error.message === "Sign-in was cancelled."
  ));
});

test("popup cancellation releases the request for a later retry", async () => {
  let calls = 0;
  const service = serviceWith({
    signInWithPopup: async () => {
      calls += 1;
      if (calls === 1) throw { code: "auth/popup-closed-by-user" };
      return { user: { uid: "qa-user" } };
    },
  });

  await assert.rejects(service.signInWithGoogle(), { code: AUTH_ERROR_CODES.POPUP_CANCELLED });
  assert.deepEqual(await service.signInWithGoogle(), { user: { uid: "qa-user" } });
  assert.equal(calls, 2);
});

test("explicit Google sign-in cancellation releases a pending popup request", async () => {
  let calls = 0;
  let resolvePopup;
  const service = serviceWith({
    signInWithPopup: () => {
      calls += 1;
      if (calls === 1) return new Promise(resolve => { resolvePopup = resolve; });
      return Promise.resolve({ user: { uid: "qa-user" } });
    },
  });

  const first = service.signInWithGoogle();
  assert.equal(service.cancelGoogleSignIn(), true);
  await assert.rejects(first, { code: AUTH_ERROR_CODES.POPUP_CANCELLED });
  assert.equal(service.cancelGoogleSignIn(), false);

  resolvePopup({ user: { uid: "stale-request" } });
  assert.deepEqual(await service.signInWithGoogle(), { user: { uid: "qa-user" } });
  assert.equal(calls, 2);
});

test("Google sign-in normalizes generic provider failures", async () => {
  const service = serviceWith({
    signInWithPopup: async () => {
      throw new Error("internal provider detail");
    },
  });

  await assert.rejects(service.signInWithGoogle(), error => (
    error.code === AUTH_ERROR_CODES.UNKNOWN
    && error.message === "Something went wrong while signing you in. Please try again."
  ));
});

test("concurrent Google sign-in calls share one popup request", async () => {
  let calls = 0;
  let resolvePopup;
  const popupResult = new Promise(resolve => { resolvePopup = resolve; });
  const service = serviceWith({
    signInWithPopup: async () => {
      calls += 1;
      return popupResult;
    },
  });

  const first = service.signInWithGoogle();
  const second = service.signInWithGoogle();
  resolvePopup({ user: { uid: "qa-user" } });

  assert.deepEqual(await Promise.all([first, second]), [
    { user: { uid: "qa-user" } },
    { user: { uid: "qa-user" } },
  ]);
  assert.equal(calls, 1);
});

test("sign-out delegates to Firebase", async () => {
  const calls = [];
  const service = serviceWith({ signOut: async auth => calls.push(auth) });
  await service.signOutUser();
  assert.equal(calls.length, 1);
});

test("concurrent sign-out calls share one Firebase request", async () => {
  let calls = 0;
  let resolveSignOut;
  const signOutResult = new Promise(resolve => { resolveSignOut = resolve; });
  const service = serviceWith({
    signOut: async () => {
      calls += 1;
      return signOutResult;
    },
  });

  const first = service.signOutUser();
  const second = service.signOutUser();
  resolveSignOut();

  await Promise.all([first, second]);
  assert.equal(calls, 1);
});

test("auth state subscription forwards users and normalizes observer errors", () => {
  const events = [];
  const unsubscribe = () => "unsubscribed";
  const service = serviceWith({
    onAuthStateChanged: (_auth, onUser, onError) => {
      onUser({ uid: "qa-user" });
      onError({ code: "auth/network-request-failed" });
      return unsubscribe;
    },
  });

  assert.equal(service.subscribeToAuthState(
    user => events.push(["user", user.uid]),
    error => events.push(["error", error.code]),
  ), unsubscribe);
  assert.deepEqual(events, [["user", "qa-user"], ["error", AUTH_ERROR_CODES.NETWORK_FAILURE]]);
});
