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
      className="rounded-full border-2 border-ink bg-ink px-6 py-2 font-extrabold text-white shadow-[3px_3px_0_var(--gold-500)] transition hover:bg-ink/80 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
    >
      𝕏 で結果をシェア
    </button>
  );
}
