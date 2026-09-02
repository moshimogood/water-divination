import type { Metadata } from "next";
import { ResultView } from "@/components/ResultView";
import { decodeResult } from "@/lib/resultUrl";
import questionsData from "@/data/nen-shindan-questions.json";

type SearchParams = Promise<{ r?: string; t?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { r } = await searchParams;
  const result = r ? decodeResult(r) : null;
  if (!result) return { title: "診断結果 | 水見式 念能力診断" };
  const mainName = questionsData.systems[result.mainSystem].name;
  const title = `私の念系統は「${mainName}」でした | 水見式 念能力診断`;
  const ogImage = `/api/og?r=${encodeURIComponent(r!)}`;
  return {
    title,
    openGraph: { title, images: [ogImage] },
    twitter: { card: "summary_large_image", title, images: [ogImage] },
  };
}

export default async function ResultPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { r, t } = await searchParams;
  return <ResultView resultParam={r ?? null} teamParam={t ?? null} />;
}
