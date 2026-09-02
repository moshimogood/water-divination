import type { Metadata } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const mplusRounded = M_PLUS_Rounded_1c({
  weight: ["400", "700", "800"],
  subsets: ["latin"],
  variable: "--font-mplus-rounded",
  display: "swap",
});

// Prefer the stable production domain: VERCEL_URL is the per-deployment URL,
// which Vercel Deployment Protection can hide from OGP crawlers.
const vercelDomain =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const siteUrl = vercelDomain ? `https://${vercelDomain}` : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "水見式 念能力診断",
  description:
    "30の質問であなたの念系統（強化・変化・放出・具現化・操作・特質）を診断。チームの念能力マッピングも作れる非公式ファンメイドアプリ。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={mplusRounded.variable}>
      <body className="antialiased min-h-screen flex flex-col">
        <header className="border-b-2 border-ink/10 bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-3xl px-4 py-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-lg font-extrabold tracking-wide text-hunter-700"
            >
              💧 水見式 念能力診断
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t-2 border-ink/10 bg-white text-xs text-ink-muted">
          <div className="mx-auto max-w-3xl px-4 py-6 space-y-1">
            <p>
              本アプリは非公式のファンメイド作品であり、原作・出版社・作者とは一切関係ありません。
            </p>
            <p>広告・課金要素はありません。個人情報は収集しません。</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
