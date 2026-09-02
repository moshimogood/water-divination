import questionsData from "@/data/nen-shindan-questions.json";
import type { NenSystem } from "@/lib/types";

const { scoring } = questionsData;

const hexagonOrder = scoring.hexagonOrder as NenSystem[];

const PERCENT_BY_DISTANCE: Record<number, number> = {
  0: 100,
  1: scoring.compatibility.adjacent,
  2: scoring.compatibility.twoApart,
  3: scoring.compatibility.opposite,
};

export function hexDistance(a: NenSystem, b: NenSystem): number {
  const ia = hexagonOrder.indexOf(a);
  const ib = hexagonOrder.indexOf(b);
  if (ia < 0 || ib < 0) throw new Error(`Unknown system: ${a} / ${b}`);
  const diff = Math.abs(ia - ib);
  return Math.min(diff, hexagonOrder.length - diff);
}

/**
 * Fixed compatibility table based on hexagon distance from the main system.
 * Independent of questionnaire scoring by design.
 */
export function compatibilityPercent(main: NenSystem, other: NenSystem): number {
  return PERCENT_BY_DISTANCE[hexDistance(main, other)];
}

export function compatibilityTable(main: NenSystem): Partial<Record<NenSystem, number>> {
  const table: Partial<Record<NenSystem, number>> = {};
  for (const system of hexagonOrder) {
    if (system === main) continue;
    table[system] = compatibilityPercent(main, system);
  }
  return table;
}
