import { Quiz } from "@/components/Quiz";

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  return <Quiz teamParam={t ?? null} />;
}
