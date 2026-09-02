import { describe, it, expect } from "vitest";
import { hexDistance, compatibilityPercent, compatibilityTable } from "@/lib/compatibility";

describe("hexDistance", () => {
  it("is 0 for the same system", () => {
    expect(hexDistance("enhancement", "enhancement")).toBe(0);
  });

  it("measures adjacency on the hexagon", () => {
    expect(hexDistance("enhancement", "transmutation")).toBe(1);
    expect(hexDistance("enhancement", "emission")).toBe(1);
    expect(hexDistance("conjuration", "specialization")).toBe(1);
  });

  it("measures two-apart and opposite distances", () => {
    expect(hexDistance("enhancement", "conjuration")).toBe(2);
    expect(hexDistance("enhancement", "manipulation")).toBe(2);
    expect(hexDistance("enhancement", "specialization")).toBe(3);
    expect(hexDistance("transmutation", "manipulation")).toBe(3);
    expect(hexDistance("conjuration", "emission")).toBe(3);
  });

  it("is symmetric", () => {
    expect(hexDistance("emission", "conjuration")).toBe(hexDistance("conjuration", "emission"));
  });
});

describe("compatibilityPercent", () => {
  it("uses the fixed table: adjacent 80 / two apart 60 / opposite 40", () => {
    expect(compatibilityPercent("enhancement", "transmutation")).toBe(80);
    expect(compatibilityPercent("enhancement", "conjuration")).toBe(60);
    expect(compatibilityPercent("enhancement", "specialization")).toBe(40);
  });

  it("is 100 for the same system", () => {
    expect(compatibilityPercent("emission", "emission")).toBe(100);
  });
});

describe("compatibilityTable", () => {
  it("lists percentages for the other five systems from the main system", () => {
    const table = compatibilityTable("enhancement");
    expect(table).toEqual({
      transmutation: 80,
      emission: 80,
      conjuration: 60,
      manipulation: 60,
      specialization: 40,
    });
  });

  it("works when specialization is the main system", () => {
    const table = compatibilityTable("specialization");
    expect(table).toEqual({
      conjuration: 80,
      manipulation: 80,
      transmutation: 60,
      emission: 60,
      enhancement: 40,
    });
  });
});
