import { describe, it, expect } from "vitest";
import { encodeResult, decodeResult } from "@/lib/resultUrl";
import type { DiagnosisResult } from "@/lib/types";

const result: DiagnosisResult = {
  scores: {
    enhancement: 82.5,
    transmutation: 61.3,
    emission: 45,
    conjuration: 20.8,
    manipulation: 33.1,
  },
  specializationScore: 12.5,
  isSpecialization: false,
  mainSystem: "enhancement",
  secondSystem: "transmutation",
};

describe("encodeResult / decodeResult", () => {
  it("round-trips a diagnosis result", () => {
    expect(decodeResult(encodeResult(result))).toEqual(result);
  });

  it("round-trips a specialization result", () => {
    const special: DiagnosisResult = {
      ...result,
      isSpecialization: true,
      mainSystem: "specialization",
      specializationScore: 90,
    };
    expect(decodeResult(encodeResult(special))).toEqual(special);
  });

  it("returns null for garbage", () => {
    expect(decodeResult("")).toBeNull();
    expect(decodeResult("garbage!!")).toBeNull();
  });
});
