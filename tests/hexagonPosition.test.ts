import { describe, it, expect } from "vitest";
import { computeMemberPosition, resolveLabelPositions } from "@/lib/hexagonPosition";

describe("computeMemberPosition", () => {
  it("places a normal result exactly at its main system's vertex", () => {
    // enhancement is hexagonOrder[0], the top vertex: (0, -1)
    const pos = computeMemberPosition("enhancement", "transmutation", null);
    expect(pos.x).toBeCloseTo(0, 5);
    expect(pos.y).toBeCloseTo(-1, 5);
  });

  it("places every normal main system at full radius (1), not scaled by score", () => {
    const pos = computeMemberPosition("manipulation", "emission", null);
    expect(Math.hypot(pos.x, pos.y)).toBeCloseTo(1, 5);
  });

  it("places a low-engagement specialization result at the exact center", () => {
    const pos = computeMemberPosition("specialization", "enhancement", "lowEngagement");
    expect(pos).toEqual({ x: 0, y: 0 });
  });

  it("places a duality specialization result partway out, toward the second system", () => {
    // secondSystem is transmutation -> hexagonOrder[1], direction (0.866, -0.5)
    const pos = computeMemberPosition("specialization", "transmutation", "duality");
    const dist = Math.hypot(pos.x, pos.y);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(1);
    // same direction as transmutation's vertex, just at a shorter radius
    expect(pos.x / dist).toBeCloseTo(0.866, 2);
    expect(pos.y / dist).toBeCloseTo(-0.5, 2);
  });

  it("is purely categorical - identical category always gives the identical point", () => {
    const a = computeMemberPosition("conjuration", "enhancement", null);
    const b = computeMemberPosition("conjuration", "manipulation", null);
    expect(a).toEqual(b);
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
