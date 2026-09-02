import { describe, it, expect } from "vitest";
import { computeMemberPosition, resolveLabelPositions } from "@/lib/hexagonPosition";
import type { NenSystem } from "@/lib/types";

function values(overrides: Partial<Record<NenSystem, number>>): Record<NenSystem, number> {
  return {
    enhancement: 0,
    transmutation: 0,
    emission: 0,
    conjuration: 0,
    manipulation: 0,
    specialization: 0,
    ...overrides,
  };
}

describe("computeMemberPosition", () => {
  it("places a perfectly balanced profile at the center", () => {
    const pos = computeMemberPosition(
      values({
        enhancement: 50,
        transmutation: 50,
        emission: 50,
        conjuration: 50,
        manipulation: 50,
        specialization: 50,
      })
    );
    expect(pos.x).toBeCloseTo(0, 5);
    expect(pos.y).toBeCloseTo(0, 5);
  });

  it("places a single dominant system exactly at that system's vertex", () => {
    const pos = computeMemberPosition(values({ enhancement: 100 }));
    // enhancement is hexagonOrder[0], the top vertex: (0, -1)
    expect(pos.x).toBeCloseTo(0, 5);
    expect(pos.y).toBeCloseTo(-1, 5);
  });

  it("places two equally strong adjacent systems between their vertices", () => {
    const pos = computeMemberPosition(values({ enhancement: 100, transmutation: 100 }));
    expect(pos.x).toBeCloseTo(0.433, 2);
    expect(pos.y).toBeCloseTo(-0.75, 2);
    expect(Math.hypot(pos.x, pos.y)).toBeLessThan(1);
  });

  it("returns the center for all-zero scores instead of NaN", () => {
    const pos = computeMemberPosition(values({}));
    expect(pos).toEqual({ x: 0, y: 0 });
  });
});

describe("resolveLabelPositions", () => {
  it("pushes apart coincident points to at least minDistance", () => {
    const resolved = resolveLabelPositions(
      [
        { x: 10, y: 10 },
        { x: 10, y: 10 },
      ],
      20
    );
    const dist = Math.hypot(resolved[0].x - resolved[1].x, resolved[0].y - resolved[1].y);
    expect(dist).toBeGreaterThanOrEqual(19.9);
  });

  it("leaves already well-separated points essentially unchanged", () => {
    const input = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ];
    const resolved = resolveLabelPositions(input, 20);
    expect(resolved[0].x).toBeCloseTo(0, 0);
    expect(resolved[0].y).toBeCloseTo(0, 0);
    expect(resolved[1].x).toBeCloseTo(100, 0);
    expect(resolved[1].y).toBeCloseTo(100, 0);
  });

  it("separates every pair among many coincident points", () => {
    const input = Array.from({ length: 6 }, () => ({ x: 5, y: 5 }));
    const resolved = resolveLabelPositions(input, 15);
    for (let i = 0; i < resolved.length; i++) {
      for (let j = i + 1; j < resolved.length; j++) {
        const dist = Math.hypot(resolved[i].x - resolved[j].x, resolved[i].y - resolved[j].y);
        expect(dist).toBeGreaterThanOrEqual(14.9);
      }
    }
  });

  it("is deterministic", () => {
    const input = [
      { x: 5, y: 5 },
      { x: 5, y: 5 },
      { x: 5, y: 5 },
    ];
    expect(resolveLabelPositions(input, 12)).toEqual(resolveLabelPositions(input, 12));
  });
});
