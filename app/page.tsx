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
        <h1 className="text-3xl font-bold text-sky-200">あなたの念系統を診断しよう</h1>
        <p className="text-slate-400 leading-relaxed">
          30の質問に答えると、6つの念系統
          （強化・変化・放出・具現化・操作・特質）のうち
          あなたがどのタイプかが分かります。
        </p>
        {team && (
          <p className="rounded-lg border border-sky-800 bg-sky-950/50 px-4 py-3 text-sm text-sky-200">
            チーム（{team.members.length}人）から招待されています。診断するとチームに参加できます。
          </p>
        )}
        <div className="flex flex-col items-center gap-3">
          <Link
            href={quizHref}
            className="inline-block rounded-full bg-sky-500 px-10 py-4 text-lg font-bold text-slate-950 transition hover:bg-sky-400"
          >
            診断をはじめる
          </Link>
          {team && (
            <Link
              href={`/team?t=${encodeURIComponent(t!)}`}
              className="text-sm text-sky-400 underline"
            >
              先にチームの結果を見る
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {hexagonOrder.map((system) => (
          <div key={system} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="font-bold" style={{ color: systems[system].color }}>
              {systems[system].name}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              {systems[system].description}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
