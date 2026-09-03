import questionsData from "@/data/nen-shindan-questions.json";
import {
  FIVE_SYSTEMS,
  type Answers,
  type DiagnosisResult,
  type FiveSystem,
  type Scores,
  type SpecializationPath,
} from "@/lib/types";

const { likert, scoring, questions } = questionsData;

const adjacency = scoring.adjacency as Record<FiveSystem, FiveSystem[]>;
const hexagonOrder = scoring.hexagonOrder as string[];

/**
 * Pairs of the five directly-scored systems that sit directly opposite each
 * other on the hexagon (3 positions apart). Enhancement has no partner here
 * - its opposite slot on the hexagon is specialization itself - so it can
 * never take part in a "duality" result.
 */
const OPPOSITE_PAIRS: [FiveSystem, FiveSystem][] = FIVE_SYSTEMS.flatMap((a) => {
  const ia = hexagonOrder.indexOf(a);
  return FIVE_SYSTEMS.filter((b) => {
    const ib = hexagonOrder.indexOf(b);
    return ia < ib && Math.abs(ia - ib) === 3;
  }).map((b): [FiveSystem, FiveSystem] => [a, b]);
});

/** Points contributed by one answer: Likert 1..5 maps to 0..4 so scores span 0-100. */
function answerToPoints(answer: number): number {
  return answer - likert.min;
}

function weight(questionSystem: FiveSystem, target: FiveSystem): number {
  if (questionSystem === target) return scoring.primaryWeight;
  if (adjacency[questionSystem]?.includes(target)) return scoring.adjacentWeight;
  return 0;
}

function emptyScores(): Scores {
  return {
    enhancement: 0,
    transmutation: 0,
    emission: 0,
    conjuration: 0,
    manipulation: 0,
  };
}

export function computeRawScores(answers: Answers): Scores {
  const raw = emptyScores();
  for (const question of questions) {
    const answer = answers[question.id];
    if (answer === undefined) {
      throw new Error(`Missing answer for question ${question.id}`);
    }
    if (!Number.isInteger(answer) || answer < likert.min || answer > likert.max) {
      throw new Error(`Answer for ${question.id} out of range: ${answer}`);
    }
    const points = answerToPoints(answer);
    const questionSystem = question.system as FiveSystem;
    for (const target of FIVE_SYSTEMS) {
      raw[target] += points * weight(questionSystem, target);
    }
  }
  return raw;
}

/** Maximum achievable raw score per system, used for 0-100 normalization. */
function maxRawScores(): Scores {
  const max = emptyScores();
  const maxPoints = likert.max - likert.min;
  for (const question of questions) {
    const questionSystem = question.system as FiveSystem;
    for (const target of FIVE_SYSTEMS) {
      max[target] += maxPoints * weight(questionSystem, target);
    }
  }
  return max;
}

/** Question data is static, so the normalization denominators are too. */
const MAX_RAW_SCORES = maxRawScores();

export function normalizeScores(raw: Scores): Scores {
  const max = MAX_RAW_SCORES;
  const scores = emptyScores();
  for (const system of FIVE_SYSTEMS) {
    scores[system] = Math.round((raw[system] / max[system]) * 1000) / 10;
  }
  return scores;
}

function scoreRange(scores: Scores): number {
  const values = FIVE_SYSTEMS.map((s) => scores[s]);
  return Math.max(...values) - Math.min(...values);
}

function maxScore(scores: Scores): number {
  return Math.max(...FIVE_SYSTEMS.map((s) => scores[s]));
}

function rankSystems(scores: Scores): FiveSystem[] {
  // Ties break by FIVE_SYSTEMS order so results are deterministic.
  return [...FIVE_SYSTEMS].sort((a, b) => scores[b] - scores[a]);
}

/** The top two systems by score, and whether they form a hexagon-opposite pair. */
function topTwoOppositePair(scores: Scores): { first: FiveSystem; second: FiveSystem; isOpposite: boolean } {
  const [first, second] = rankSystems(scores);
  const isOpposite = OPPOSITE_PAIRS.some(
    ([a, b]) => (a === first && b === second) || (a === second && b === first)
  );
  return { first, second, isOpposite };
}

/**
 * "Doesn't clearly fit any of the five systems" path: scores must be both
 * flat (no system stands out - range <= threshold) AND low (not even the
 * best-matching system is a real resonance - max <= threshold). A
 * flat-but-high profile ("equally strong at everything") or a
 * flat-but-neutral one (careless/noncommittal answering, which clusters
 * around the midpoint) is intentionally excluded.
 */
export function isLowEngagementSpecialization(scores: Scores): boolean {
  return (
    scoreRange(scores) <= scoring.specializationRangeThreshold &&
    maxScore(scores) <= scoring.specializationMaxScoreThreshold
  );
}

/**
 * "Paradoxical, two-sided" path: the top two systems are a genuine
 * hexagon-opposite pair, both clearly resonant (>= duality min score) and
 * near-tied (gap <= duality max gap) rather than one dominant and one
 * secondary. Enhancement has no opposite among the five, so it can never
 * take part.
 */
export function isDualitySpecialization(scores: Scores): boolean {
  const { first, second, isOpposite } = topTwoOppositePair(scores);
  const firstScore = scores[first];
  const secondScore = scores[second];
  return (
    isOpposite &&
    secondScore >= scoring.specializationDualityMinScore &&
    firstScore - secondScore <= scoring.specializationDualityMaxGap
  );
}

/** Which specialization rule applies, if any. Duality takes precedence. */
export function specializationPathFor(scores: Scores): SpecializationPath {
  if (isDualitySpecialization(scores)) return "duality";
  if (isLowEngagementSpecialization(scores)) return "lowEngagement";
  return null;
}

/** Convenience boolean form of specializationPathFor, used by tests. */
export function judgeSpecialization(scores: Scores): boolean {
  return specializationPathFor(scores) !== null;
}

/**
 * Visualization-only value for the hexagon chart's 6th axis: the stronger
 * of the two paths' signals, so the chart always agrees with the verdict.
 */
export function specializationScore(scores: Scores): number {
  const flatness = Math.max(0, 100 - 2 * scoreRange(scores));
  const lowness = Math.max(0, 100 - maxScore(scores));
  const lowEngagementComponent = (flatness * lowness) / 100;

  const { first, second, isOpposite } = topTwoOppositePair(scores);
  const closeness = Math.max(0, 100 - 2 * (scores[first] - scores[second]));
  const dualityComponent = isOpposite ? (closeness * scores[second]) / 100 : 0;

  return Math.round(Math.max(lowEngagementComponent, dualityComponent) * 10) / 10;
}

export function computeResult(answers: Answers): DiagnosisResult {
  const scores = normalizeScores(computeRawScores(answers));
  const ranked = rankSystems(scores);
  const specializationPath = specializationPathFor(scores);
  const isSpecialization = specializationPath !== null;
  return {
    scores,
    specializationScore: specializationScore(scores),
    isSpecialization,
    specializationPath,
    mainSystem: isSpecialization ? "specialization" : ranked[0],
    secondSystem: isSpecialization ? ranked[0] : ranked[1],
  };
}
