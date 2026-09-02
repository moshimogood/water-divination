import { ImageResponse } from "next/og";
import questionsData from "@/data/nen-shindan-questions.json";
import { decodeResult } from "@/lib/resultUrl";
import { decodeTeam } from "@/lib/team";
import { MEMBER_PALETTE } from "@/lib/memberPalette";
import type { NenSystem } from "@/lib/types";

export const runtime = "edge";

const { systems, scoring } = questionsData;
const hexagonOrder = scoring.hexagonOrder as NenSystem[];

const WIDTH = 1200;
const HEIGHT = 630;
const APP_NAME = "水見式 念能力診断";

/** Fetch a Noto Sans JP subset containing exactly the glyphs we render. */
async function loadJapaneseFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`;
    const cssRes = await fetch(cssUrl);
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const match = css.match(/src:\s*url\((.+?)\)\s*format\('(?:opentype|truetype)'\)/);
    if (!match) return null;
    const fontRes = await fetch(match[1]);
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}

function hexPoints(cx: number, cy: number, radii: number[]): string {
  return radii
    .map((radius, i) => {
      const angle = (Math.PI / 180) * (i * 60 - 90);
      return `${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`;
    })
    .join(" ");
}

function HexagonChartBlock({
  seriesList,
  size,
}: {
  seriesList: { color: string; values: Record<NenSystem, number> }[];
  size: number;
}) {
  const center = size / 2;
  const maxRadius = size * 0.36;
  const labelRadius = size * 0.46;
  return (
    <div style={{ display: "flex", position: "relative", width: size, height: size }}>
      {/* Satori does not support svg <text>, so labels are positioned divs. */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {[0.5, 1].map((fraction) => (
          <polygon
            key={fraction}
            points={hexPoints(center, center, hexagonOrder.map(() => maxRadius * fraction))}
            fill="none"
            stroke="#334155"
            strokeWidth={2}
          />
        ))}
        {seriesList.map((series, i) => (
          <polygon
            key={i}
            points={hexPoints(
              center,
              center,
              hexagonOrder.map(
                (system) => (Math.max(0, Math.min(100, series.values[system])) / 100) * maxRadius
              )
            )}
            fill={series.color}
            fillOpacity={0.25}
            stroke={series.color}
            strokeWidth={3}
          />
        ))}
      </svg>
      {hexagonOrder.map((system, i) => {
        const angle = (Math.PI / 180) * (i * 60 - 90);
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        return (
          <div
            key={system}
            style={{
              position: "absolute",
              left: x - 60,
              top: y - 16,
              width: 120,
              display: "flex",
              justifyContent: "center",
              fontSize: size * 0.05,
              color: systems[system].color,
            }}
          >
            {systems[system].shortName}
          </div>
        );
      })}
    </div>
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const r = searchParams.get("r");
  const t = searchParams.get("t");

  const result = r ? decodeResult(r) : null;
  const team = t && !result ? decodeTeam(t) : null;

  let content: React.ReactElement;
  let textForFont: string;

  if (result) {
    const main = systems[result.mainSystem];
    const second = systems[result.secondSystem];
    textForFont = `${APP_NAME}私の念系統は第2系統：${main.name}${second.name}強化変化放出具現化操作特質`;
    content = (
      <div style={{ display: "flex", alignItems: "center", gap: 60 }}>
        <HexagonChartBlock
          seriesList={[
            {
              color: main.color,
              values: { ...result.scores, specialization: result.specializationScore },
            },
          ]}
          size={420}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 36, color: "#94a3b8" }}>私の念系統は</div>
          <div style={{ fontSize: 96, color: main.color }}>{main.name}</div>
          <div style={{ display: "flex", fontSize: 32, color: "#94a3b8" }}>
            <span>第2系統：</span>
            <span style={{ color: second.color }}>{second.name}</span>
          </div>
        </div>
      </div>
    );
  } else if (team) {
    const names = team.members.map((m) => m.nickname).join("・");
    textForFont = `${APP_NAME}チームの念能力マッピング人${names}強化変化放出具現化操作特質0123456789`;
    content = (
      <div style={{ display: "flex", alignItems: "center", gap: 60 }}>
        <HexagonChartBlock
          seriesList={team.members.map((m, i) => ({
            color: MEMBER_PALETTE[i % MEMBER_PALETTE.length],
            values: { ...m.scores, specialization: m.specializationScore },
          }))}
          size={420}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 560 }}>
          <div style={{ fontSize: 56, color: "#e2e8f0" }}>チームの念能力マッピング</div>
          <div style={{ fontSize: 40, color: "#38bdf8" }}>{`${team.members.length}人のメンバー`}</div>
          <div style={{ fontSize: 28, color: "#94a3b8" }}>{names}</div>
        </div>
      </div>
    );
  } else {
    textForFont = `${APP_NAME}あなたの念系統を診断しよう`;
    content = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        <div style={{ fontSize: 88, color: "#7dd3fc" }}>{APP_NAME}</div>
        <div style={{ fontSize: 40, color: "#94a3b8" }}>あなたの念系統を診断しよう</div>
      </div>
    );
  }

  const fontData = await loadJapaneseFont(textForFont);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "linear-gradient(135deg, #0b1120 0%, #0f2540 100%)",
          fontFamily: fontData ? "NotoSansJP" : "sans-serif",
        }}
      >
        {content}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 28,
            color: "#475569",
            display: "flex",
          }}
        >
          {APP_NAME}
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: fontData
        ? [{ name: "NotoSansJP", data: fontData, weight: 700 as const, style: "normal" as const }]
        : undefined,
    }
  );
}
