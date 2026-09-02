import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamHexagonMap } from "@/components/TeamHexagonMap";
import type { NenSystem } from "@/lib/types";

const flatValues: Record<NenSystem, number> = {
  enhancement: 50,
  transmutation: 50,
  emission: 50,
  conjuration: 50,
  manipulation: 50,
  specialization: 50,
};

describe("TeamHexagonMap", () => {
  it("renders the six axis labels", () => {
    render(
      <TeamHexagonMap
        members={[{ id: "a", label: "ゴン", color: "#f00", values: flatValues }]}
      />
    );
    for (const label of ["強化", "変化", "放出", "具現化", "操作", "特質"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders exactly one name label per member", () => {
    render(
      <TeamHexagonMap
        members={[
          { id: "a", label: "ゴン", color: "#f00", values: flatValues },
          { id: "b", label: "キルア", color: "#0f0", values: flatValues },
        ]}
      />
    );
    expect(screen.getByText("ゴン")).toBeInTheDocument();
    expect(screen.getByText("キルア")).toBeInTheDocument();
  });

  it("keeps every member marker at a distinct position even when scores are identical", () => {
    const members = Array.from({ length: 4 }, (_, i) => ({
      id: `m${i}`,
      label: `メンバー${i}`,
      color: "#38f",
      values: flatValues,
    }));
    const { container } = render(<TeamHexagonMap members={members} />);
    const markers = container.querySelectorAll("[data-member-marker]");
    expect(markers).toHaveLength(4);
    const positions = new Set(
      Array.from(markers).map((m) => `${m.getAttribute("cx")},${m.getAttribute("cy")}`)
    );
    expect(positions.size).toBe(4);
  });

  it("renders nothing member-related for an empty team", () => {
    const { container } = render(<TeamHexagonMap members={[]} />);
    expect(container.querySelectorAll("[data-member-marker]")).toHaveLength(0);
  });
});
