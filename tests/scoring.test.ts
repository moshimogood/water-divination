import { describe, it, expect } from "vitest";
import questionsData from "@/data/nen-shindan-questions.json";
import {
  computeRawScores,
  normalizeScores,
  computeResult,
  judgeSpecialization,
  isDualitySpecialization,
  specializationPathFor,
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

describe("isDualitySpecialization", () => {
  it("recognizes a near-tied opposite pair (transmutation <-> manipulation)", () => {
    const scores: Scores = {
      enhancement: 30,
      transmutation: 75,
      emission: 30,
      conjuration: 30,
      manipulation: 70,
    };
    expect(isDualitySpecialization(scores)).toBe(true);
  });

  it("recognizes the other opposite pair (conjuration <-> emission)", () => {
    const scores: Scores = {
      enhancement: 30,
      transmutation: 30,
      emission: 72,
      conjuration: 68,
      manipulation: 30,
    };
    expect(isDualitySpecialization(scores)).toBe(true);
  });

  it("rejects a dominant system whose opposite-pair partner trails far behind", () => {
    const scores: Scores = {
      enhancement: 30,
      transmutation: 95,
      emission: 30,
      conjuration: 30,
      manipulation: 40,
    };
    expect(isDualitySpecialization(scores)).toBe(false);
  });

  it("rejects a tied pair that is directly adjacent on the hexagon", () => {
    // enhancement/transmutation are neighbors, so transmutation's score is
    // partly enhancement bleeding over (weight 0.3), not an independent
    // second resonance - a near-tie there is an artifact, not a paradox.
    const scores: Scores = {
      enhancement: 75,
      transmutation: 72,
      emission: 30,
      conjuration: 30,
      manipulation: 30,
    };
    expect(isDualitySpecialization(scores)).toBe(false);
  });

  it("recognizes a near-tied two-apart pair, not just true opposites", () => {
    // enhancement/conjuration are two apart (neither adjacent nor directly
    // opposite) - still a genuine independent double-resonance.
    const scores: Scores = {
      enhancement: 72,
      transmutation: 30,
      emission: 30,
      conjuration: 68,
      manipulation: 30,
    };
    expect(isDualitySpecialization(scores)).toBe(true);
  });

  it("lets enhancement take part via a two-apart partner", () => {
    // Enhancement has no direct opposite among the five (that slot is
    // specialization itself), but it does have two-apart partners
    // (conjuration, manipulation) it can pair with here.
    const scores: Scores = {
      enhancement: 70,
      transmutation: 30,
      emission: 30,
      conjuration: 30,
      manipulation: 66,
    };
    expect(isDualitySpecialization(scores)).toBe(true);
  });

  it("rejects a tied pair that isn't genuinely high", () => {
    const scores: Scores = {
      enhancement: 30,
      transmutation: 40,
      emission: 30,
      conjuration: 30,
      manipulation: 38,
    };
    expect(isDualitySpecialization(scores)).toBe(false);
  });
});

describe("specializationPathFor", () => {
  it("returns null for a normal single-lean profile", () => {
    const scores: Scores = {
      enhancement: 80,
      transmutation: 40,
      emission: 30,
      conjuration: 20,
      manipulation: 25,
    };
    expect(specializationPathFor(scores)).toBeNull();
  });

  it("returns 'lowEngagement' for flat and low scores", () => {
    const scores: Scores = {
      enhancement: 20,
      transmutation: 22,
      emission: 18,
      conjuration: 21,
      manipulation: 19,
    };
    expect(specializationPathFor(scores)).toBe("lowEngagement");
  });

  it("returns 'duality' for a near-tied opposite pair", () => {
    const scores: Scores = {
      enhancement: 30,
      transmutation: 75,
      emission: 30,
      conjuration: 30,
      manipulation: 70,
    };
    expect(specializationPathFor(scores)).toBe("duality");
  });
});

describe("duality specialization via computeResult", () => {
  it("classifies a near-tied transmutation/manipulation profile as duality specialization", () => {
    const answers = answersBySystem({ transmutation: 5, manipulation: 5 }, 3);
    const result = computeResult(answers);
    expect(result.isSpecialization).toBe(true);
    expect(result.mainSystem).toBe("specialization");
    expect(result.specializationPath).toBe("duality");
    expect(result.secondSystem).toBe("manipulation");
  });

  it("tags the low-engagement path distinctly from duality", () => {
    const result = computeResult(answersAll(1));
    expect(result.isSpecialization).toBe(true);
    expect(result.specializationPath).toBe("lowEngagement");
  });

  it("tags a normal single-system result with a null path", () => {
    const result = computeResult(answersBySystem({ enhancement: 5 }, 1));
    expect(result.isSpecialization).toBe(false);
    expect(result.specializationPath).toBeNull();
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
