import { describe, it, expect, beforeEach } from "vitest";
import { getOrCreateClientId } from "@/lib/clientId";

describe("getOrCreateClientId", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates a non-empty id and persists it", () => {
    const id = getOrCreateClientId();
    expect(id.length).toBeGreaterThan(0);
    expect(getOrCreateClientId()).toBe(id);
  });

  it("returns different ids for fresh storage", () => {
    const first = getOrCreateClientId();
    localStorage.clear();
    const second = getOrCreateClientId();
    expect(second).not.toBe(first);
  });
});
