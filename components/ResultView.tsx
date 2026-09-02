"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import questionsData from "@/data/nen-shindan-questions.json";
import { HexagonChart } from "@/components/HexagonChart";
import { ShareOnX } from "@/components/ShareOnX";
import { decodeResult } from "@/lib/resultUrl";
import { compatibilityTable } from "@/lib/compatibility";
import { decodeTeam, encodeTeam, upsertMember, validateNickname, NICKNAME_MAX_LENGTH, TEAM_MAX_MEMBERS, TEAM_DATA_VERSION } from "@/lib/team";
import { getOrCreateClientId } from "@/lib/clientId";
import type { NenSystem } from "@/lib/types";

const { systems } = questionsData;

export function ResultView({
  resultParam,
  teamParam,
}: {
  resultParam: string | null;
  teamParam: string | null;
}) {
  const router = useRouter();
  const result = useMemo(() => (resultParam ? decodeResult(resultParam) : null), [resultParam]);
  const team = useMemo(() => (teamParam ? decodeTeam(teamParam) : null), [teamParam]);

  const [clientId, setClientId] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setClientId(getOrCreateClientId());
  }, []);

  const existingMember = useMemo(
    () => (team && clientId ? team.members.find((m) => m.clientId === clientId) : undefined),
    [team, clientId]
  );

  useEffect(() => {
    if (existingMember) setNickname(existingMember.nickname);
  }, [existingMember]);

  if (!result) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-ink-muted">診断結果を読み込めませんでした。</p>
        <Link href="/quiz" className="font-bold text-hunter-700 underline">
          診断をやり直す
        </Link>
      </div>
    );
  }

  const main = systems[result.mainSystem];
  const second = systems[result.secondSystem];
  const compat = compatibilityTable(result.mainSystem);
  const chartValues: Record<NenSystem, number> = {
    ...result.scores,
    specialization: result.specializationScore,
  };

  const teamIsFull =
    !!team && !existingMember && team.members.length >= TEAM_MAX_MEMBERS;

  function joinOrCreateTeam() {
    if (!result || !clientId) return;
    const validationError = validateNickname(nickname);
    if (validationError) {
      setError(validationError);
      return;
    }
    const base = team ?? { v: TEAM_DATA_VERSION, members: [] };
    try {
      const next = upsertMember(base, {
        clientId,
        nickname: nickname.trim(),
        scores: result.scores,
        specializationScore: result.specializationScore,
        mainSystem: result.mainSystem,
        secondSystem: result.secondSystem,
      });
      router.push(`/team?t=${encodeURIComponent(encodeTeam(next))}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "チームに追加できませんでした");
    }
  }

  return (
    <div className="space-y-10">
      <section className="text-center space-y-2">
        <p className="font-bold text-ink-muted">あなたの念系統は…</p>
        <h1 className="text-4xl font-extrabold" style={{ color: main.color }}>
          {main.name}
        </h1>
        <p className="mx-auto max-w-md leading-relaxed text-ink">{main.description}</p>
        <p className="text-sm font-bold text-ink-muted">
          第2系統：<span style={{ color: second.color }}>{second.name}</span>
        </p>
      </section>

      <section className="flex justify-center rounded-2xl border-2 border-ink/10 bg-surface p-4 text-ink-muted shadow-sm">
        <HexagonChart
          series={[{ label: "あなた", color: main.color, values: chartValues }]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-extrabold text-ink">系統ごとの相性</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {Object.entries(compat).map(([system, percent]) => (
            <li
              key={system}
              className="flex items-center justify-between rounded-xl border-2 border-ink/10 bg-surface px-4 py-2 shadow-sm"
            >
              <span className="font-bold" style={{ color: systems[system as NenSystem].color }}>
                {systems[system as NenSystem].name}
              </span>
              <span className="font-extrabold text-ink">{percent}%</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink-muted">
          ※ 相性は主系統からの六角形上の距離で決まる固定値です
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border-2 border-ink/10 bg-surface p-5 shadow-sm">
        <h2 className="font-extrabold text-ink">
          {team ? "チームに自分の結果を追加する" : "チームを作ってみんなで診断"}
        </h2>
        {team && (
          <p className="text-sm text-ink-muted">
            現在のチーム：{team.members.length}人
            {existingMember && "（あなたの結果を上書き更新します）"}
          </p>
        )}
        {teamIsFull ? (
          <p className="text-sm font-bold text-gold-500">
            チームが上限（{TEAM_MAX_MEMBERS}人）に達しているため追加できません。
          </p>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError(null);
              }}
              placeholder={`ニックネーム（必須・${NICKNAME_MAX_LENGTH}文字以内）`}
              maxLength={NICKNAME_MAX_LENGTH}
              className="flex-1 rounded-xl border-2 border-ink/10 bg-white px-4 py-2 text-ink placeholder:text-ink-muted/60"
            />
            <button
              onClick={joinOrCreateTeam}
              disabled={!clientId}
              className="rounded-full border-2 border-ink bg-hunter-600 px-6 py-2 font-extrabold text-white shadow-[3px_3px_0_var(--ink)] transition hover:bg-hunter-700 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
            >
              {team ? (existingMember ? "結果を更新" : "チームに参加") : "チームを作る"}
            </button>
          </div>
        )}
        {error && <p className="text-sm font-bold text-red-600">{error}</p>}
      </section>

      <section className="flex flex-wrap items-center justify-center gap-4">
        <ShareOnX
          text={`私の念系統は「${main.name}」でした！ #水見式念能力診断`}
          buildUrl={() =>
            `${window.location.origin}/result?r=${encodeURIComponent(resultParam!)}`
          }
        />
        <Link
          href={teamParam ? `/quiz?t=${encodeURIComponent(teamParam)}` : "/quiz"}
          className="text-sm font-bold text-ink-muted underline"
        >
          もう一度診断する
        </Link>
      </section>
    </div>
  );
}
