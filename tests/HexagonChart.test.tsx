import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HexagonChart } from "@/components/HexagonChart";

const values = {
  enhancement: 80,
  transmutation: 60,
  emission: 40,
  conjuration: 20,
  manipulation: 30,
  specialization: 10,
};

describe("HexagonChart", () => {
  it("renders all six system labels", () => {
    render(<HexagonChart series={[{ label: "自分", color: "#f00", values }]} />);
    for (const label of ["強化", "変化", "放出", "具現化", "操作", "特質"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders one polygon per series", () => {
    const { container } = render(
      <HexagonChart
        series={[
          { label: "A", color: "#f00", values },
          { label: "B", color: "#0f0", values },
        ]}
      />
    );
    expect(container.querySelectorAll("polygon[data-series]")).toHaveLength(2);
  });
});
