import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { FIVE_SYSTEMS, type DiagnosisResult, type FiveSystem, type Scores } from "@/lib/types";

const RESULT_VERSION = 1;

interface CompactResult {
  v: number;
  /** scores in FIVE_SYSTEMS order */
  s: number[];
  sp: number;
  main: string;
  second: string;
}

export function encodeResult(result: DiagnosisResult): string {
  const compact: CompactResult = {
    v: RESULT_VERSION,
    s: FIVE_SYSTEMS.map((system) => result.scores[system]),
    sp: result.specializationScore,
    main: result.mainSystem,
    second: result.secondSystem,
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
    if (!c.s.every((n) => typeof n === "number")) return null;
    if (typeof c.sp !== "number") return null;
    if (typeof c.main !== "string" || typeof c.second !== "string") return null;
    const isSpecialization = c.main === "specialization";
    if (!isSpecialization && !FIVE_SYSTEMS.includes(c.main as FiveSystem)) return null;
    if (!FIVE_SYSTEMS.includes(c.second as FiveSystem)) return null;
    const scores = Object.fromEntries(
      FIVE_SYSTEMS.map((system, i) => [system, (c.s as number[])[i]])
    ) as Scores;
    return {
      scores,
      specializationScore: c.sp,
      isSpecialization,
      mainSystem: c.main as DiagnosisResult["mainSystem"],
      secondSystem: c.second as FiveSystem,
    };
  } catch {
    return null;
  }
}
