export const FIVE_SYSTEMS = [
  "enhancement",
  "transmutation",
  "emission",
  "conjuration",
  "manipulation",
] as const;

export type FiveSystem = (typeof FIVE_SYSTEMS)[number];
export type NenSystem = FiveSystem | "specialization";

export type Answers = Record<string, number>;

export type Scores = Record<FiveSystem, number>;

/**
 * Which rule classified the result as specialization:
 * "lowEngagement" - flat and low scores, doesn't resonate with any system.
 * "duality" - a near-tied pair of hexagon-opposite systems, both genuinely
 * high (a paradoxical, two-sided profile).
 * null when the result is not specialization. See lib/scoring.ts.
 */
export type SpecializationPath = "lowEngagement" | "duality" | null;

export interface DiagnosisResult {
  /** Normalized 0-100 scores for the five directly-scored systems */
  scores: Scores;
  /** Derived 0-100 score for specialization (visualization only) */
  specializationScore: number;
  /** True when specializationPath is not null — see lib/scoring.ts. */
  isSpecialization: boolean;
  /** Which rule triggered specialization, if any. */
  specializationPath: SpecializationPath;
  mainSystem: NenSystem;
  secondSystem: FiveSystem;
}

export interface TeamMember {
  clientId: string;
  nickname: string;
  scores: Scores;
  specializationScore: number;
  mainSystem: NenSystem;
  secondSystem: FiveSystem;
}

export interface Team {
  v: number;
  members: TeamMember[];
}
