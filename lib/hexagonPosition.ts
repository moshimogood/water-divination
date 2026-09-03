import questionsData from "@/data/nen-shindan-questions.json";
import { hexagonUnitVector, type Point } from "@/lib/hexagonGeometry";
import type { FiveSystem, NenSystem, SpecializationPath } from "@/lib/types";

const hexagonOrder = questionsData.scoring.hexagonOrder as NenSystem[];

/** Radius (as a fraction of the hexagon's max radius) for a duality result's point. */
const DUALITY_RADIUS = 0.5;

/**
 * Places a member on the hexagon by which category their result falls
 * into, not by the precise magnitude of their scores: a normal result
 * sits exactly at its main system's vertex, a low-engagement
 * specialization sits at the dead center, and a duality specialization
 * sits partway out along its (higher-scoring) paired system's direction -
 * distinct from both a normal vertex and the low-engagement center.
 *
 * Earlier this computed a continuous weighted-vector-sum position from
 * the raw 5-system scores, but that made two opposite-pulling duality
 * scores cancel out and land right on top of a low-engagement result -
 * visually indistinguishable despite being different verdicts for a
 * different reason. Recognizing "which layer a result belongs to" matters
 * more than reproducing its exact numbers here.
 */
export function computeMemberPosition(
  mainSystem: NenSystem,
  secondSystem: FiveSystem,
  specializationPath: SpecializationPath
): Point {
  if (mainSystem === "specialization") {
    if (specializationPath !== "duality") return { x: 0, y: 0 };
    const dir = hexagonUnitVector(hexagonOrder.indexOf(secondSystem), hexagonOrder.length);
    return { x: dir.x * DUALITY_RADIUS, y: dir.y * DUALITY_RADIUS };
  }
  return hexagonUnitVector(hexagonOrder.indexOf(mainSystem), hexagonOrder.length);
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
