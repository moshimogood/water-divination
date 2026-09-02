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

  it("judges specialization when scores are flat AND low (range <= 10, max <= 45)", () => {
    expect(judgeSpecialization({ ...flat(30), enhancement: 40 })).toBe(true);
    expect(judgeSpecialization(flat(20))).toBe(true);
  });

  it("does not judge specialization when the flat range exceeds 10", () => {
    expect(judgeSpecialization({ ...flat(30), enhancement: 40.1 })).toBe(false);
  });

  it("does not judge specialization when flat scores are not low, even if range is 0", () => {
    // Being equally into all five systems ("likes everything") is not the
    // same as "doesn't fit any of them" - specialization requires low
    // absolute engagement, not just balance.
    expect(judgeSpecialization(flat(50))).toBe(false);
    expect(judgeSpecialization(flat(100))).toBe(false);
  });
});

describe("specialization calibration", () => {
  // A realistic, consistent single-system lean (all 6 of one system's
  // questions answered "4" while everything else is neutral "3") must
  // resolve to that system, not to specialization.
  it("does not classify a consistent single-system lean as specialization", () => {
    const answers: Answers = {};
    for (const q of questionsData.questions) {
      answers[q.id] = q.system === "enhancement" ? 4 : 3;
    }
    const result = computeResult(answers);
    expect(result.isSpecialization).toBe(false);
    expect(result.mainSystem).toBe("enhancement");
  });

  // Careless / noncommittal answering (hovering around "neutral") must NOT
  // default to specialization - it's the most common answer pattern and
  // specialization is supposed to be rare, reserved for people who clearly
  // don't resonate with any of the five systems.
  it("does not classify fully neutral answers as specialization", () => {
    expect(computeResult(answersAll(3)).isSpecialization).toBe(false);
  });

  // Uniformly agreeing with everything ("balanced, good at all five") is
  // also not specialization - the flavor is "doesn't fit any of them", not
  // "fits all of them equally".
  it("does not classify uniformly high answers as specialization", () => {
    expect(computeResult(answersAll(4)).isSpecialization).toBe(false);
    expect(computeResult(answersAll(5)).isSpecialization).toBe(false);
  });

  // Uniformly disagreeing with everything is the clearest real-world case
  // of "doesn't fit any of the five systems" and must resolve to
  // specialization.
  it("classifies uniformly low (disagreeing) answers as specialization", () => {
    expect(computeResult(answersAll(1)).isSpecialization).toBe(true);
    expect(computeResult(answersAll(2)).isSpecialization).toBe(true);
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

  it("derives specialization as main when the five scores are balanced and low", () => {
    const result = computeResult(answersAll(1));
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
