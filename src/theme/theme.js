export const THEME_STORAGE_KEY = "deutsch-hub-theme";

export const THEME_PREFERENCES = Object.freeze({
  SYSTEM: "system",
  LIGHT: "light",
  DARK: "dark",
});

const VALID_PREFERENCES = new Set(Object.values(THEME_PREFERENCES));

export function normalizeThemePreference(value) {
  return VALID_PREFERENCES.has(value) ? value : THEME_PREFERENCES.SYSTEM;
}

export function getStoredThemePreference(storage = getLocalStorage()) {
  try {
    return normalizeThemePreference(storage?.getItem(THEME_STORAGE_KEY));
  } catch {
    return THEME_PREFERENCES.SYSTEM;
  }
}

export function saveThemePreference(preference, storage = getLocalStorage()) {
  const normalized = normalizeThemePreference(preference);
  try {
    storage?.setItem(THEME_STORAGE_KEY, normalized);
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
  return normalized;
}

export function getSystemTheme(matchMedia = getMatchMedia()) {
  try {
    return matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function resolveTheme(preference, systemTheme = getSystemTheme()) {
  const normalized = normalizeThemePreference(preference);
  if (normalized !== THEME_PREFERENCES.SYSTEM) return normalized;
  return systemTheme === THEME_PREFERENCES.DARK ? THEME_PREFERENCES.DARK : THEME_PREFERENCES.LIGHT;
}

export function applyTheme(preference, root = getDocumentElement()) {
  const normalized = normalizeThemePreference(preference);
  const resolved = resolveTheme(normalized);

  if (root?.setAttribute) {
    root.setAttribute("data-theme", resolved);
    root.setAttribute("data-theme-preference", normalized);
  }

  return resolved;
}

function getLocalStorage() {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function getMatchMedia() {
  try {
    return typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia.bind(window)
      : null;
  } catch {
    return null;
  }
}

function getDocumentElement() {
  return typeof document !== "undefined" ? document.documentElement : null;
}
