# 水見式 念能力診断

ハンターハンターの水見式（念系統）診断を模した非公式ファンメイドWebアプリ。
30問の質問に答えると、6つの念系統（強化・変化・放出・具現化・操作・特質）のどのタイプかを診断し、
チームメンバーの結果を集約した「チームの念能力マッピング」も作れます。

要件定義書: [docs/requirements.md](docs/requirements.md)

## 特徴

- **個人診断**: 5段階リッカート×30問。六角形チャートで系統バランスを可視化
- **特質系の導出**: 直接出題せず、5系統スコアのバランス（range ≤ 15）から判定
- **チーム機能（URLチェーン方式）**: サーバー・DB不要。結果を lz-string で圧縮してURLに格納し、
  「最新URLを開く → 書き換える → 新URLを再共有」で追加・更新・削除を実現
- **Xシェア**: 個人・チームともに OGP 動的画像（`/api/og`、Edge・ステートレス）付きで共有可能

## 開発

```bash
npm install
npm run dev    # 開発サーバー
npm test       # Vitest（TDD）
npm run lint   # ESLint
npm run build  # 本番ビルド
```

## 構成

- `data/nen-shindan-questions.json` — 設問・スコアリング設定
- `lib/` — 診断ロジック（scoring / compatibility / team / resultUrl / clientId）
- `components/` — UI（HexagonChart / Quiz / ResultView / TeamView）
- `app/` — Next.js App Router ページ + OGP 画像 API
- `tests/` — Vitest テストスイート

## デプロイ

Vercel を想定（提供ドメインをそのまま使用）。バックエンド・DBは持ちません。

## 免責

本アプリは非公式のファンメイド作品であり、原作・出版社・作者とは一切関係ありません。
広告・課金要素はなく、個人情報も収集しません。
