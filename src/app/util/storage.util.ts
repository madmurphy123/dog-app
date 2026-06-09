/* Tiny localStorage JSON wrapper. Namespaced so keys never collide. */

/* Bump the version segment to invalidate previously-persisted state. */
const PREFIX = 'dogday.v2.';

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable — non-fatal */
  }
}
