import questionsData from "@/data/nen-shindan-questions.json";
import type { NenSystem } from "@/lib/types";

const { scoring, systems } = questionsData;
const hexagonOrder = scoring.hexagonOrder as NenSystem[];

export interface HexagonSeries {
  label: string;
  color: string;
  values: Record<NenSystem, number>;
}

interface HexagonChartProps {
  series: HexagonSeries[];
  size?: number;
}

function vertex(center: number, radius: number, index: number): [number, number] {
  // Start at the top, go clockwise. 6 axes -> 60 degrees apart.
  const angle = (Math.PI / 180) * (index * 60 - 90);
  return [center + radius * Math.cos(angle), center + radius * Math.sin(angle)];
}

function polygonPoints(center: number, radii: number[]): string {
  return radii
    .map((radius, i) => vertex(center, radius, i).map((n) => n.toFixed(1)).join(","))
    .join(" ");
}

export function HexagonChart({ series, size = 320 }: HexagonChartProps) {
  const center = size / 2;
  const maxRadius = size * 0.36;
  const labelRadius = size * 0.45;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      style={{ maxWidth: size }}
      role="img"
      aria-label="念系統バランスの六角形チャート"
    >
      {/* grid rings */}
      {[0.25, 0.5, 0.75, 1].map((fraction) => (
        <polygon
          key={fraction}
          points={polygonPoints(center, hexagonOrder.map(() => maxRadius * fraction))}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.18}
        />
      ))}
      {/* axes */}
      {hexagonOrder.map((system, i) => {
        const [x, y] = vertex(center, maxRadius, i);
        return (
          <line
            key={system}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="currentColor"
            strokeOpacity={0.18}
          />
        );
      })}
      {/* series polygons */}
      {series.map((s, si) => (
        <polygon
          key={`${s.label}-${si}`}
          data-series={s.label}
          points={polygonPoints(
            center,
            hexagonOrder.map((system) => (Math.max(0, Math.min(100, s.values[system])) / 100) * maxRadius)
          )}
          fill={s.color}
          fillOpacity={0.22}
          stroke={s.color}
          strokeWidth={2}
        />
      ))}
      {/* labels */}
      {hexagonOrder.map((system, i) => {
        const [x, y] = vertex(center, labelRadius, i);
        return (
          <text
            key={system}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.045}
            fill={systems[system].color}
            fontWeight={600}
          >
            {systems[system].shortName}
          </text>
        );
      })}
    </svg>
  );
}
