import type { Metadata } from "next";
import { TeamView } from "@/components/TeamView";
import { decodeTeam } from "@/lib/team";

type SearchParams = Promise<{ t?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { t } = await searchParams;
  const team = t ? decodeTeam(t) : null;
  if (!team) return { title: "チーム | 水見式 念能力診断" };
  const title = `チームの念能力マッピング（${team.members.length}人） | 水見式 念能力診断`;
  const ogImage = `/api/og?t=${encodeURIComponent(t!)}`;
  return {
    title,
    openGraph: { title, images: [ogImage] },
    twitter: { card: "summary_large_image", title, images: [ogImage] },
  };
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { t } = await searchParams;
  return <TeamView teamParam={t ?? null} />;
}
