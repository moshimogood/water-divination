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
  specializationPath: null,
  mainSystem: "enhancement",
  secondSystem: "transmutation",
};

describe("encodeResult / decodeResult", () => {
  it("round-trips a diagnosis result", () => {
    expect(decodeResult(encodeResult(result))).toEqual(result);
  });

  it("round-trips a low-engagement specialization result", () => {
    const special: DiagnosisResult = {
      ...result,
      isSpecialization: true,
      specializationPath: "lowEngagement",
      mainSystem: "specialization",
      specializationScore: 90,
    };
    expect(decodeResult(encodeResult(special))).toEqual(special);
  });

  it("round-trips a duality specialization result", () => {
    const special: DiagnosisResult = {
      ...result,
      isSpecialization: true,
      specializationPath: "duality",
      mainSystem: "specialization",
      secondSystem: "manipulation",
      specializationScore: 70,
    };
    expect(decodeResult(encodeResult(special))).toEqual(special);
  });

  it("defaults specializationPath to lowEngagement for older links without a path code", () => {
    // Simulate a pre-duality shared link: same payload shape but no "p" key.
    const legacyEncoded = encodeResult({
      ...result,
      isSpecialization: true,
      specializationPath: null, // encodeResult omits "p" when this is null
      mainSystem: "specialization",
    });
    const decoded = decodeResult(legacyEncoded);
    expect(decoded?.specializationPath).toBe("lowEngagement");
  });

  it("returns null for garbage", () => {
    expect(decodeResult("")).toBeNull();
    expect(decodeResult("garbage!!")).toBeNull();
  });
});
