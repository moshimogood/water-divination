"use client";

export function ShareOnX({ text, buildUrl }: { text: string; buildUrl: () => string }) {
  function share() {
    const intent = new URL("https://twitter.com/intent/tweet");
    intent.searchParams.set("text", text);
    intent.searchParams.set("url", buildUrl());
    window.open(intent.toString(), "_blank", "noopener,noreferrer");
  }

  return (
    <button
      onClick={share}
      className="rounded-full border border-slate-600 bg-slate-900 px-6 py-2 font-bold text-slate-100 transition hover:border-sky-500"
    >
      𝕏 で結果をシェア
    </button>
  );
}
