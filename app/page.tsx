import Link from "next/link";
import questionsData from "@/data/nen-shindan-questions.json";
import { decodeTeam } from "@/lib/team";
import type { NenSystem } from "@/lib/types";

const { systems, scoring } = questionsData;
const hexagonOrder = scoring.hexagonOrder as NenSystem[];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const team = t ? decodeTeam(t) : null;
  const quizHref = t ? `/quiz?t=${encodeURIComponent(t)}` : "/quiz";

  return (
    <div className="space-y-10">
      <section className="text-center space-y-4 py-8">
        <h1 className="text-3xl font-extrabold text-hunter-700">あなたの念系統を診断しよう</h1>
        <p className="leading-relaxed text-ink-muted">
          30の質問に答えると、6つの念系統
          （強化・変化・放出・具現化・操作・特質）のうち
          あなたがどのタイプかが分かります。
        </p>
        {team && (
          <p className="rounded-xl border-2 border-hunter-600/30 bg-hunter-50 px-4 py-3 text-sm font-bold text-hunter-700">
            チーム（{team.members.length}人）から招待されています。診断するとチームに参加できます。
          </p>
        )}
        <div className="flex flex-col items-center gap-3">
          <Link
            href={quizHref}
            className="inline-block rounded-full border-2 border-ink bg-hunter-600 px-10 py-4 text-lg font-extrabold text-white shadow-[3px_3px_0_var(--ink)] transition hover:bg-hunter-700 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            診断をはじめる
          </Link>
          {team && (
            <Link
              href={`/team?t=${encodeURIComponent(t!)}`}
              className="text-sm font-bold text-hunter-700 underline"
            >
              先にチームの結果を見る
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {hexagonOrder.map((system) => (
          <div
            key={system}
            className="rounded-2xl border-2 border-ink/10 bg-surface p-4 shadow-sm"
          >
            <h2 className="font-extrabold" style={{ color: systems[system].color }}>
              {systems[system].name}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              {systems[system].description}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
