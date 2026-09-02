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

export interface DiagnosisResult {
  /** Normalized 0-100 scores for the five directly-scored systems */
  scores: Scores;
  /** Derived 0-100 score for specialization (visualization only) */
  specializationScore: number;
  /**
   * True when the five scores are both flat (max-min range within
   * scoring.specializationRangeThreshold) and low (max score within
   * scoring.specializationMaxScoreThreshold) — see judgeSpecialization
   * in lib/scoring.ts.
   */
  isSpecialization: boolean;
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
