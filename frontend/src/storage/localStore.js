// Safe wrappers around window.localStorage.
// Storage can be unavailable (private mode, blocked site data, full quota), so
// every access is guarded: reads fall back to a default, writes fail silently.

export function readItem(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not saved this time; the app keeps working from memory
  }
}

export function readJSON(key, fallback) {
  const raw = readItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  writeItem(key, JSON.stringify(value));
}
