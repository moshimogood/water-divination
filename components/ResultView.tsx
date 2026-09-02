"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import questionsData from "@/data/nen-shindan-questions.json";
import { HexagonChart } from "@/components/HexagonChart";
import { ShareOnX } from "@/components/ShareOnX";
import { decodeResult } from "@/lib/resultUrl";
import { compatibilityTable } from "@/lib/compatibility";
import { decodeTeam, encodeTeam, upsertMember, validateNickname, TEAM_MAX_MEMBERS, TEAM_DATA_VERSION } from "@/lib/team";
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
        <p className="text-slate-300">診断結果を読み込めませんでした。</p>
        <Link href="/quiz" className="text-sky-400 underline">
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
        <p className="text-slate-400">あなたの念系統は…</p>
        <h1 className="text-4xl font-extrabold" style={{ color: main.color }}>
          {main.name}
        </h1>
        <p className="mx-auto max-w-md leading-relaxed text-slate-300">{main.description}</p>
        <p className="text-sm text-slate-400">
          第2系統：<span style={{ color: second.color }}>{second.name}</span>
        </p>
      </section>

      <section className="flex justify-center text-slate-500">
        <HexagonChart
          series={[{ label: "あなた", color: main.color, values: chartValues }]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-bold text-slate-200">系統ごとの相性</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {Object.entries(compat).map(([system, percent]) => (
            <li
              key={system}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2"
            >
              <span style={{ color: systems[system as NenSystem].color }}>
                {systems[system as NenSystem].name}
              </span>
              <span className="font-bold text-slate-100">{percent}%</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-500">
          ※ 相性は主系統からの六角形上の距離で決まる固定値です
        </p>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="font-bold text-slate-200">
          {team ? "チームに自分の結果を追加する" : "チームを作ってみんなで診断"}
        </h2>
        {team && (
          <p className="text-sm text-slate-400">
            現在のチーム：{team.members.length}人
            {existingMember && "（あなたの結果を上書き更新します）"}
          </p>
        )}
        {teamIsFull ? (
          <p className="text-sm text-amber-400">
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
              placeholder="ニックネーム（必須・15文字以内）"
              maxLength={30}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100 placeholder:text-slate-600"
            />
            <button
              onClick={joinOrCreateTeam}
              disabled={!clientId}
              className="rounded-lg bg-sky-500 px-6 py-2 font-bold text-slate-950 transition hover:bg-sky-400 disabled:opacity-50"
            >
              {team ? (existingMember ? "結果を更新" : "チームに参加") : "チームを作る"}
            </button>
          </div>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
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
          className="text-sm text-slate-400 underline"
        >
          もう一度診断する
        </Link>
      </section>
    </div>
  );
}
