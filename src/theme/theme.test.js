import test from "node:test";
import assert from "node:assert/strict";
import {
  THEME_PREFERENCES,
  getStoredThemePreference,
  normalizeThemePreference,
  resolveTheme,
  saveThemePreference,
} from "./theme.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
  };
}

test("defaults to the system theme preference", () => {
  assert.equal(normalizeThemePreference(null), THEME_PREFERENCES.SYSTEM);
  assert.equal(getStoredThemePreference(memoryStorage()), THEME_PREFERENCES.SYSTEM);
});

test("reads valid persisted theme preferences", () => {
  assert.equal(getStoredThemePreference(memoryStorage({ "deutsch-hub-theme": "light" })), "light");
  assert.equal(getStoredThemePreference(memoryStorage({ "deutsch-hub-theme": "dark" })), "dark");
});

test("invalid persisted values fall back to system", () => {
  assert.equal(getStoredThemePreference(memoryStorage({ "deutsch-hub-theme": "neon" })), "system");
});

test("system preference resolves to the current system theme", () => {
  assert.equal(resolveTheme("system", "light"), "light");
  assert.equal(resolveTheme("system", "dark"), "dark");
});

test("explicit preferences override the system theme", () => {
  assert.equal(resolveTheme("light", "dark"), "light");
  assert.equal(resolveTheme("dark", "light"), "dark");
});

test("saving a preference normalizes and persists it", () => {
  const storage = memoryStorage();
  assert.equal(saveThemePreference("dark", storage), "dark");
  assert.equal(storage.getItem("deutsch-hub-theme"), "dark");
  assert.equal(saveThemePreference("invalid", storage), "system");
  assert.equal(storage.getItem("deutsch-hub-theme"), "system");
});

test("storage failures safely fall back to system", () => {
  const unavailable = {
    getItem() { throw new Error("storage unavailable"); },
    setItem() { throw new Error("storage unavailable"); },
  };
  assert.equal(getStoredThemePreference(unavailable), "system");
  assert.equal(saveThemePreference("dark", unavailable), "dark");
});
