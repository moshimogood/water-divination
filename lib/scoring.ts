import questionsData from "@/data/nen-shindan-questions.json";
import {
  FIVE_SYSTEMS,
  type Answers,
  type DiagnosisResult,
  type FiveSystem,
  type Scores,
} from "@/lib/types";

const { likert, scoring, questions } = questionsData;

const adjacency = scoring.adjacency as Record<FiveSystem, FiveSystem[]>;

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

/** Specialization is derived, not asked: balanced scores (range <= threshold) qualify. */
export function judgeSpecialization(scores: Scores): boolean {
  return scoreRange(scores) <= scoring.specializationRangeThreshold;
}

/** Visualization-only value: the more balanced the five scores, the higher. */
export function specializationScore(scores: Scores): number {
  return Math.round(Math.max(0, 100 - 2 * scoreRange(scores)) * 10) / 10;
}

function rankSystems(scores: Scores): FiveSystem[] {
  // Ties break by FIVE_SYSTEMS order so results are deterministic.
  return [...FIVE_SYSTEMS].sort((a, b) => scores[b] - scores[a]);
}

export function computeResult(answers: Answers): DiagnosisResult {
  const scores = normalizeScores(computeRawScores(answers));
  const ranked = rankSystems(scores);
  const isSpecialization = judgeSpecialization(scores);
  return {
    scores,
    specializationScore: specializationScore(scores),
    isSpecialization,
    mainSystem: isSpecialization ? "specialization" : ranked[0],
    secondSystem: isSpecialization ? ranked[0] : ranked[1],
  };
}
