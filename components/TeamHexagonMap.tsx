import questionsData from "@/data/nen-shindan-questions.json";
import { hexagonUnitVector } from "@/lib/hexagonGeometry";
import { computeMemberPosition, resolveLabelPositions } from "@/lib/hexagonPosition";
import type { FiveSystem, NenSystem, SpecializationPath } from "@/lib/types";

const { scoring, systems } = questionsData;
const hexagonOrder = scoring.hexagonOrder as NenSystem[];

export interface TeamMemberPoint {
  id: string;
  label: string;
  color: string;
  mainSystem: NenSystem;
  secondSystem: FiveSystem;
  specializationPath: SpecializationPath;
}

interface TeamHexagonMapProps {
  members: TeamMemberPoint[];
  size?: number;
}

function toPixel(center: number, radius: number, unit: { x: number; y: number }) {
  return { x: center + radius * unit.x, y: center + radius * unit.y };
}

function polygonPoints(center: number, radii: number[]): string {
  return radii
    .map((radius, i) => {
      const { x, y } = toPixel(center, radius, hexagonUnitVector(i, hexagonOrder.length));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/**
 * Plots each team member as a single marker + name (a placeholder for a
 * future avatar image) at the position their result category projects to
 * on the hexagon (see lib/hexagonPosition.ts), instead of overlaying one
 * filled polygon per member.
 */
export function TeamHexagonMap({ members, size = 360 }: TeamHexagonMapProps) {
  const center = size / 2;
  const maxRadius = size * 0.32;
  const labelRadius = size * 0.44;
  const markerRadius = size * 0.032;
  const minLabelSpacing = size * 0.16;

  // Markers can require large separation when several members share a very
  // similar (or identical) score profile near a vertex; without a clamp the
  // push-apart pass can place a marker's circle or name label outside the
  // SVG viewBox, where it renders over surrounding page content instead of
  // being clipped. Keep every resolved point, plus room below it for the
  // name label, inside the canvas.
  const sideMargin = markerRadius * 2;
  const bottomMargin = markerRadius + size * 0.035 + size * 0.045;

  const rawPositions = members.map((member) =>
    toPixel(
      center,
      maxRadius,
      computeMemberPosition(member.mainSystem, member.secondSystem, member.specializationPath)
    )
  );
  const resolvedPositions = resolveLabelPositions(rawPositions, minLabelSpacing).map((p) => ({
    x: Math.min(size - sideMargin, Math.max(sideMargin, p.x)),
    y: Math.min(size - bottomMargin, Math.max(sideMargin, p.y)),
  }));

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      style={{ maxWidth: size }}
      role="img"
      aria-label="チームメンバーの念系統マップ"
    >
      {[0.25, 0.5, 0.75, 1].map((fraction) => (
        <polygon
          key={fraction}
          points={polygonPoints(center, hexagonOrder.map(() => maxRadius * fraction))}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.35}
        />
      ))}
      {hexagonOrder.map((system, i) => {
        const { x, y } = toPixel(center, maxRadius, hexagonUnitVector(i, hexagonOrder.length));
        return (
          <line
            key={system}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="currentColor"
            strokeOpacity={0.35}
          />
        );
      })}
      {hexagonOrder.map((system, i) => {
        const { x, y } = toPixel(center, labelRadius, hexagonUnitVector(i, hexagonOrder.length));
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
      {members.map((member, i) => {
        const raw = rawPositions[i];
        const resolved = resolvedPositions[i];
        const nudged = Math.hypot(resolved.x - raw.x, resolved.y - raw.y) > 1;
        return (
          <g key={member.id}>
            {nudged && (
              <line
                x1={raw.x}
                y1={raw.y}
                x2={resolved.x}
                y2={resolved.y}
                stroke={member.color}
                strokeOpacity={0.4}
                strokeDasharray="2,3"
              />
            )}
            <circle
              data-member-marker
              cx={resolved.x}
              cy={resolved.y}
              r={markerRadius}
              fill={member.color}
              stroke="white"
              strokeWidth={2}
            />
            <text
              x={resolved.x}
              y={resolved.y + markerRadius + size * 0.035}
              textAnchor="middle"
              fontSize={size * 0.034}
              fontWeight={700}
              fill={member.color}
              stroke="white"
              strokeWidth={4}
              paintOrder="stroke"
            >
              {member.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
