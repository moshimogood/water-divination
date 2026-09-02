"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import questionsData from "@/data/nen-shindan-questions.json";
import { computeResult } from "@/lib/scoring";
import { encodeResult } from "@/lib/resultUrl";
import type { Answers } from "@/lib/types";

const { questions, likert } = questionsData;

const likertValues = Array.from(
  { length: likert.max - likert.min + 1 },
  (_, i) => likert.min + i
);

export function Quiz({ teamParam }: { teamParam: string | null }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const progress = Math.round((index / questions.length) * 100);

  function finish(finalAnswers: Answers) {
    const result = computeResult(finalAnswers);
    const params = new URLSearchParams();
    params.set("r", encodeResult(result));
    if (teamParam) params.set("t", teamParam);
    router.push(`/result?${params.toString()}`);
  }

  function answer(value: number) {
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    if (isLast) {
      finish(next);
    } else {
      setIndex(index + 1);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <div className="flex justify-between text-sm font-bold text-ink-muted">
          <span>
            質問 {index + 1} / {questions.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-3 rounded-full border-2 border-ink/10 bg-white">
          <div
            className="h-full rounded-full bg-hunter-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <h1 className="min-h-20 text-xl font-extrabold leading-relaxed text-ink">
        {question.text}
      </h1>

      <div className="space-y-2">
        {likertValues.map((value) => (
          <button
            key={value}
            onClick={() => answer(value)}
            className={`w-full rounded-xl border-2 px-4 py-3 text-left font-bold transition ${
              answers[question.id] === value
                ? "border-hunter-600 bg-hunter-50 text-hunter-700"
                : "border-ink/10 bg-surface text-ink hover:border-hunter-600/50"
            }`}
          >
            {likert.labels[value - likert.min]}
          </button>
        ))}
      </div>

      <div className="flex justify-between text-sm">
        <button
          onClick={() => setIndex(Math.max(0, index - 1))}
          disabled={index === 0}
          className="font-bold text-ink-muted underline disabled:invisible"
        >
          ← 前の質問へ
        </button>
      </div>
    </div>
  );
}
