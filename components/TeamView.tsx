"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import questionsData from "@/data/nen-shindan-questions.json";
import { TeamHexagonMap } from "@/components/TeamHexagonMap";
import { ShareOnX } from "@/components/ShareOnX";
import { decodeTeam, encodeTeam, removeMember } from "@/lib/team";
import { getOrCreateClientId } from "@/lib/clientId";
import { MEMBER_PALETTE } from "@/lib/memberPalette";
import type { NenSystem, TeamMember } from "@/lib/types";

const { systems } = questionsData;

export function TeamView({ teamParam }: { teamParam: string | null }) {
  const router = useRouter();
  const team = useMemo(() => (teamParam ? decodeTeam(teamParam) : null), [teamParam]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setClientId(getOrCreateClientId());
  }, []);

  if (!team) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-ink-muted">チームのデータを読み込めませんでした。</p>
        <Link href="/quiz" className="font-bold text-hunter-700 underline">
          診断をはじめる
        </Link>
      </div>
    );
  }

  const mapMembers = team.members.map((member, i) => ({
    id: member.clientId,
    label: member.nickname,
    color: MEMBER_PALETTE[i % MEMBER_PALETTE.length],
    mainSystem: member.mainSystem,
    secondSystem: member.secondSystem,
    specializationPath: member.specializationPath,
  }));

  const distribution = team.members.reduce<Partial<Record<NenSystem, number>>>(
    (acc, member) => {
      acc[member.mainSystem] = (acc[member.mainSystem] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const quizHref = teamParam ? `/quiz?t=${encodeURIComponent(teamParam)}` : "/quiz";
  const isMine = (member: TeamMember) => clientId !== null && member.clientId === clientId;
  const alreadyJoined = team.members.some(isMine);

  function deleteMyResult() {
    if (!clientId || !confirm("チームから自分の結果を削除しますか？")) return;
    const next = removeMember(team!, clientId);
    router.replace(`/team?t=${encodeURIComponent(encodeTeam(next))}`);
  }

  async function copyShareUrl() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("このURLをコピーしてください", window.location.href);
    }
  }

  return (
    <div className="space-y-10">
      <section className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold text-hunter-700">チームの念能力マッピング</h1>
        <p className="font-bold text-ink-muted">{team.members.length}人のメンバー</p>
      </section>

      <section className="flex justify-center rounded-2xl border-2 border-ink/10 bg-surface p-4 text-ink-muted shadow-sm">
        <TeamHexagonMap members={mapMembers} size={380} />
      </section>

      <section className="space-y-2">
        <h2 className="font-extrabold text-ink">系統の分布</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(distribution).map(([system, count]) => (
            <span
              key={system}
              className="rounded-full border-2 px-3 py-1 text-sm font-bold"
              style={{
                color: systems[system as NenSystem].color,
                borderColor: systems[system as NenSystem].color,
              }}
            >
              {systems[system as NenSystem].name} × {count}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-extrabold text-ink">メンバー</h2>
        <ul className="space-y-2">
          {team.members.map((member, i) => (
            <li
              key={member.clientId}
              className="flex items-center justify-between rounded-xl border-2 border-ink/10 bg-surface px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-block h-3 w-3 rounded-full border border-white shadow"
                  style={{ background: MEMBER_PALETTE[i % MEMBER_PALETTE.length] }}
                />
                <div>
                  <p className="font-extrabold text-ink">
                    {member.nickname}
                    {isMine(member) && (
                      <span className="ml-2 rounded-full bg-hunter-100 px-2 py-0.5 text-xs font-bold text-hunter-700">
                        あなた
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-muted">
                    主系統：
                    <span style={{ color: systems[member.mainSystem].color }}>
                      {systems[member.mainSystem].name}
                    </span>
                    ／ 第2系統：
                    <span style={{ color: systems[member.secondSystem].color }}>
                      {systems[member.secondSystem].name}
                    </span>
                  </p>
                </div>
              </div>
              {isMine(member) && (
                <button
                  onClick={deleteMyResult}
                  className="text-xs font-bold text-red-600 underline"
                >
                  削除
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 rounded-2xl border-2 border-ink/10 bg-surface p-5 shadow-sm">
        <h2 className="font-extrabold text-ink">チームを共有する</h2>
        <p className="text-sm leading-relaxed text-ink-muted">
          このページのURLにチーム全員の結果が入っています。
          メンバーを追加・更新・削除するたびに新しいURLになるので、
          <span className="font-bold text-hunter-700">常に最新のURLを共有</span>してください。
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={copyShareUrl}
            className="rounded-full border-2 border-ink bg-hunter-600 px-6 py-2 font-extrabold text-white shadow-[3px_3px_0_var(--ink)] transition hover:bg-hunter-700 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            {copied ? "コピーしました！" : "チームURLをコピー"}
          </button>
          <ShareOnX
            text={`チーム（${team.members.length}人）の念能力マッピングを作りました！ #水見式念能力診断`}
            buildUrl={() => window.location.href}
          />
        </div>
      </section>

      <section className="text-center">
        <Link href={quizHref} className="text-sm font-bold text-hunter-700 underline">
          {alreadyJoined ? "再診断して結果を更新する" : "自分も診断してチームに参加する"}
        </Link>
      </section>
    </div>
  );
}
