import { describe, it, expect } from "vitest";
import questionsData from "@/data/nen-shindan-questions.json";
import {
  computeRawScores,
  normalizeScores,
  computeResult,
  judgeSpecialization,
} from "@/lib/scoring";
import { FIVE_SYSTEMS, type Answers, type Scores } from "@/lib/types";

function answersAll(value: number): Answers {
  const answers: Answers = {};
  for (const q of questionsData.questions) answers[q.id] = value;
  return answers;
}

function answersBySystem(map: Partial<Record<string, number>>, fallback = 1): Answers {
  const answers: Answers = {};
  for (const q of questionsData.questions) answers[q.id] = map[q.system] ?? fallback;
  return answers;
}

describe("questions data", () => {
  it("has 30 questions, 6 per system", () => {
    expect(questionsData.questions).toHaveLength(30);
    for (const system of FIVE_SYSTEMS) {
      const count = questionsData.questions.filter((q) => q.system === system).length;
      expect(count).toBe(6);
    }
  });
});

describe("computeRawScores", () => {
  it("throws when an answer is missing", () => {
    const answers = answersAll(3);
    delete answers["q01"];
    expect(() => computeRawScores(answers)).toThrow();
  });

  it("throws on out-of-range answers", () => {
    const answers = answersAll(3);
    answers["q01"] = 6;
    expect(() => computeRawScores(answers)).toThrow();
    answers["q01"] = 0;
    expect(() => computeRawScores(answers)).toThrow();
  });

  it("gives 0 raw score for all-minimum answers", () => {
    const raw = computeRawScores(answersAll(1));
    for (const system of FIVE_SYSTEMS) expect(raw[system]).toBe(0);
  });

  it("applies weight 1.0 to the primary system and 0.3 to hexagon-adjacent systems", () => {
    // Only enhancement questions answered max (5 -> 4 points), rest minimum.
    const raw = computeRawScores(answersBySystem({ enhancement: 5 }));
    expect(raw.enhancement).toBeCloseTo(6 * 4 * 1.0);
    // enhancement is adjacent to transmutation and emission on the hexagon
    expect(raw.transmutation).toBeCloseTo(6 * 4 * 0.3);
    expect(raw.emission).toBeCloseTo(6 * 4 * 0.3);
    // not adjacent: no bleed
    expect(raw.conjuration).toBe(0);
    expect(raw.manipulation).toBe(0);
  });
});

describe("normalizeScores", () => {
  it("normalizes all-max answers to 100 for every system", () => {
    const scores = normalizeScores(computeRawScores(answersAll(5)));
    for (const system of FIVE_SYSTEMS) expect(scores[system]).toBe(100);
  });

  it("normalizes all-min answers to 0 for every system", () => {
    const scores = normalizeScores(computeRawScores(answersAll(1)));
    for (const system of FIVE_SYSTEMS) expect(scores[system]).toBe(0);
  });

  it("normalizes mid answers to 50 for every system", () => {
    const scores = normalizeScores(computeRawScores(answersAll(3)));
    for (const system of FIVE_SYSTEMS) expect(scores[system]).toBeCloseTo(50);
  });
});

describe("judgeSpecialization", () => {
  const flat = (v: number): Scores => ({
    enhancement: v,
    transmutation: v,
    emission: v,
    conjuration: v,
    manipulation: v,
  });

  it("judges specialization when range <= 15", () => {
    expect(judgeSpecialization({ ...flat(50), enhancement: 65 })).toBe(true);
    expect(judgeSpecialization(flat(50))).toBe(true);
  });

  it("does not judge specialization when range > 15", () => {
    expect(judgeSpecialization({ ...flat(50), enhancement: 65.1 })).toBe(false);
  });
});

describe("computeResult", () => {
  it("picks the highest-scored system as main and the runner-up as second", () => {
    const result = computeResult(
      answersBySystem({ enhancement: 5, transmutation: 4 }, 1)
    );
    expect(result.mainSystem).toBe("enhancement");
    expect(result.secondSystem).toBe("transmutation");
    expect(result.isSpecialization).toBe(false);
  });

  it("derives specialization as main when the five scores are balanced", () => {
    const result = computeResult(answersAll(4));
    expect(result.isSpecialization).toBe(true);
    expect(result.mainSystem).toBe("specialization");
    // second system is the top of the five directly-scored systems
    expect(FIVE_SYSTEMS).toContain(result.secondSystem);
  });

  it("breaks ties deterministically", () => {
    const a = computeResult(answersAll(5));
    const b = computeResult(answersAll(5));
    expect(a.mainSystem).toBe(b.mainSystem);
    expect(a.secondSystem).toBe(b.secondSystem);
  });

  it("keeps scores in 0-100", () => {
    const result = computeResult(answersBySystem({ conjuration: 5, manipulation: 2 }, 1));
    for (const system of FIVE_SYSTEMS) {
      expect(result.scores[system]).toBeGreaterThanOrEqual(0);
      expect(result.scores[system]).toBeLessThanOrEqual(100);
    }
    expect(result.specializationScore).toBeGreaterThanOrEqual(0);
    expect(result.specializationScore).toBeLessThanOrEqual(100);
  });
});
