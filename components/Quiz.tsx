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
        <div className="flex justify-between text-sm text-slate-400">
          <span>
            質問 {index + 1} / {questions.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-800">
          <div
            className="h-2 rounded-full bg-sky-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <h1 className="min-h-20 text-xl font-bold leading-relaxed text-slate-100">
        {question.text}
      </h1>

      <div className="space-y-2">
        {likertValues.map((value) => (
          <button
            key={value}
            onClick={() => answer(value)}
            className={`w-full rounded-lg border px-4 py-3 text-left transition ${
              answers[question.id] === value
                ? "border-sky-400 bg-sky-950"
                : "border-slate-700 bg-slate-900/60 hover:border-sky-600"
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
          className="text-slate-400 underline disabled:invisible"
        >
          ← 前の質問へ
        </button>
      </div>
    </div>
  );
}
