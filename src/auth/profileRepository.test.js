import assert from "node:assert/strict";
import { test } from "node:test";
import { PROFILE_STATES, readUserProfile } from "./profileRepository.js";

function dependencies(getDoc) {
  return {
    db: "db",
    doc: (...args) => args,
    getDoc,
  };
}

test("profile lookup distinguishes an existing profile", async () => {
  const result = await readUserProfile("qa-user", dependencies(async () => ({
    exists: () => true,
    data: () => ({ uid: "qa-user", level: "A1" }),
  })));
  assert.equal(result.status, PROFILE_STATES.FOUND);
  assert.equal(result.data.uid, "qa-user");
});

test("profile lookup distinguishes a missing profile", async () => {
  const result = await readUserProfile("new-user", dependencies(async () => ({
    exists: () => false,
  })));
  assert.deepEqual(result, { status: PROFILE_STATES.NOT_FOUND, data: null });
});

test("profile read failures never become not-found", async () => {
  const readFailure = new Error("permission denied");
  const result = await readUserProfile("qa-user", dependencies(async () => {
    throw readFailure;
  }));
  assert.equal(result.status, PROFILE_STATES.READ_ERROR);
  assert.equal(result.data, null);
  assert.equal(result.error, readFailure);
});
