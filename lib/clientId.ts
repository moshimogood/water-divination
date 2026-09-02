const STORAGE_KEY = "nen-shindan-client-id";

function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Identifies "my result" inside a shared team so re-diagnosis overwrites
 * instead of appending. Stored in localStorage; falls back to a throwaway
 * id when storage is unavailable.
 */
export function getOrCreateClientId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id = randomId();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return randomId();
  }
}
