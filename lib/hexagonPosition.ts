import questionsData from "@/data/nen-shindan-questions.json";
import { hexagonUnitVector, type Point } from "@/lib/hexagonGeometry";
import type { NenSystem } from "@/lib/types";

const hexagonOrder = questionsData.scoring.hexagonOrder as NenSystem[];

/**
 * Projects a member's 6-axis scores into a single point inside the hexagon
 * via a weighted vector sum of the axis directions (a "type compass"
 * position), rather than drawing a full radar polygon per member. A member
 * who scores highly on one system lands near that vertex; a balanced
 * profile lands near the center.
 */
export function computeMemberPosition(values: Record<NenSystem, number>): Point {
  let sumX = 0;
  let sumY = 0;
  let sumWeight = 0;
  hexagonOrder.forEach((system, i) => {
    const weight = Math.max(0, values[system] ?? 0);
    const { x, y } = hexagonUnitVector(i, hexagonOrder.length);
    sumX += weight * x;
    sumY += weight * y;
    sumWeight += weight;
  });
  if (sumWeight === 0) return { x: 0, y: 0 };
  return { x: sumX / sumWeight, y: sumY / sumWeight };
}

/**
 * Nudges points that are closer than `minDistance` apart until every pair
 * clears it, so member name labels (and future avatars) don't overlap.
 * Deterministic: ties are broken by a fixed angle derived from index order.
 */
export function resolveLabelPositions(
  points: Point[],
  minDistance: number,
  iterations = 200
): Point[] {
  const result = points.map((p) => ({ ...p }));
  for (let iter = 0; iter < iterations; iter++) {
    let moved = false;
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const dx = result[j].x - result[i].x;
        const dy = result[j].y - result[i].y;
        const dist = Math.hypot(dx, dy);
        if (dist < minDistance) {
          moved = true;
          const goldenAngle = (i * 137.5 + j * 47.3) * (Math.PI / 180);
          const ux = dist > 1e-6 ? dx / dist : Math.cos(goldenAngle);
          const uy = dist > 1e-6 ? dy / dist : Math.sin(goldenAngle);
          const push = (minDistance - dist) / 2;
          result[i].x -= ux * push;
          result[i].y -= uy * push;
          result[j].x += ux * push;
          result[j].y += uy * push;
        }
      }
    }
    if (!moved) break;
  }
  return result;
}
