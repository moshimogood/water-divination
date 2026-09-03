import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import {
  FIVE_SYSTEMS,
  type DiagnosisResult,
  type FiveSystem,
  type Scores,
  type SpecializationPath,
} from "@/lib/types";

const RESULT_VERSION = 1;

/** Compact single-character encoding for specializationPath, keeping URLs short. */
const PATH_TO_CODE: Record<Exclude<SpecializationPath, null>, string> = {
  lowEngagement: "l",
  duality: "d",
};
const CODE_TO_PATH: Record<string, Exclude<SpecializationPath, null>> = {
  l: "lowEngagement",
  d: "duality",
};

interface CompactResult {
  v: number;
  /** scores in FIVE_SYSTEMS order */
  s: number[];
  sp: number;
  main: string;
  second: string;
  /** specialization path code ("l"/"d"), omitted when not specialization */
  p?: string;
}

export function encodeResult(result: DiagnosisResult): string {
  const compact: CompactResult = {
    v: RESULT_VERSION,
    s: FIVE_SYSTEMS.map((system) => result.scores[system]),
    sp: result.specializationScore,
    main: result.mainSystem,
    second: result.secondSystem,
    ...(result.specializationPath ? { p: PATH_TO_CODE[result.specializationPath] } : {}),
  };
  return compressToEncodedURIComponent(JSON.stringify(compact));
}

export function decodeResult(encoded: string): DiagnosisResult | null {
  if (!encoded) return null;
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null) return null;
    const c = parsed as Record<string, unknown>;
    if (c.v !== RESULT_VERSION) return null;
    if (!Array.isArray(c.s) || c.s.length !== FIVE_SYSTEMS.length) return null;
    if (!c.s.every((n) => Number.isFinite(n))) return null;
    if (typeof c.sp !== "number" || !Number.isFinite(c.sp)) return null;
    if (typeof c.main !== "string" || typeof c.second !== "string") return null;
    const isSpecialization = c.main === "specialization";
    if (!isSpecialization && !FIVE_SYSTEMS.includes(c.main as FiveSystem)) return null;
    if (!FIVE_SYSTEMS.includes(c.second as FiveSystem)) return null;
    if (c.p !== undefined && typeof c.p !== "string") return null;
    const scores = Object.fromEntries(
      FIVE_SYSTEMS.map((system, i) => [system, (c.s as number[])[i]])
    ) as Scores;
    // Older shared links have no path code; default a specialization result
    // to "lowEngagement" (the only path that existed at the time) so old
    // links keep working.
    const specializationPath: SpecializationPath = isSpecialization
      ? (c.p && CODE_TO_PATH[c.p as string]) || "lowEngagement"
      : null;
    return {
      scores,
      specializationScore: c.sp,
      isSpecialization,
      specializationPath,
      mainSystem: c.main as DiagnosisResult["mainSystem"],
      secondSystem: c.second as FiveSystem,
    };
  } catch {
    return null;
  }
}
