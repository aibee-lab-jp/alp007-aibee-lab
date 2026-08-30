# CLAUDE.md

このリポジトリはアイビーラボ（AiBee Lab）のコーポレートサイト（aibee-lab.jp）— 「とりあえず47」（just47.jp）の運営元プロフィールサイト — のフロントエンド実装です。just47 ポータル（別リポジトリ）とは分離した、本サイト専用リポジトリです。

## 最優先のルール

- **スタック・インフラは仕様書に従い、独自に選び直さないこと。** 特に GitHub Pages や Vercel など、仕様書と異なるホスティングを勝手に選ばない。
- スタック：Next.js **16**（App Router）＋ TypeScript ＋ Tailwind CSS **v4**。ランタイムは Node.js **24**（開発・配信とも統一。配信先 AWS Lambda は nodejs24.x）。IaC：Terraform。CI/CD：GitHub Actions。
- ホスティング／レンダリング：フォーム送信以外は全て SSG（S3 / CloudFront から配信）。問い合わせフォーム送信のみ動的で、Server Action（SSR）＋ OpenNext → AWS Lambda。詳細は `docs/SITE_ARCHITECTURE.md` §2〜§5 を参照。
- **本サイトに無いもの（勝手に作らないこと）**：ニュース・ブログ（markdown パイプライン）、`content/` ディレクトリ、GA4・Cookie 同意バナー。いずれも仕様書で「持たない」と決定済み（`docs/SITE_ARCHITECTURE.md` §2・§4・§6）。
- 判断に迷う点、仕様書と handoff デザインが食い違う点があれば、勝手に決めず、何が食い違っているかを報告すること。

## 仕様書（参照ドキュメント・これが正）

- `docs/SITE_ARCHITECTURE.md` … 技術構成・インフラ・CI/CD・フォーム挙動・移行計画。実装の拠り所。
- `docs/SITE_DESIGN_BRIEF.md` … デザインの方針と確定文言。
- これらの仕様書は読み取り専用の参照先。仕様の変更が必要な場合は、勝手に書き換えず報告すること。
- 仕様書は**自己完結**している。実装にあたって just47 など他リポジトリの文書を参照する必要はない（本リポの docs/ だけで足りる）。

## git の扱い

- **git のコミットはしないこと。** コミットはリポジトリ所有者が自分で管理する。コードの作成・編集までを行い、コミットは行わない。

## 進め方

- 段階的に実装する。指示された範囲だけを実装し、指示外のページや機能を勝手に作らない。
- ページは `/`（トップ）・`/contact`・`/privacy`・カスタム 404 の最小構成。これ以外のページを追加しない。

## リポジトリ構成

- `src/` … サイトコード（Next.js。`src/app`＝ルーティング、`src/components`・`src/lib` 等＝サイトコード）
- `infra/` … Terraform（インフラ定義）
- `docs/` … 仕様書
- `public/` … 配信する静的ファイル（`aibee-lab-logo-ink.svg`＝ヘッダーのロゴ、`sw.js` 等）
- `assets/brand/` … 配信しないブランド素材（`aibee-lab-logo.svg`＝ロゴ原版・濃色パネル `#22424d`。favicon / OG 画像のマスター）
- `.reference/just47/` … 参照実装スナップショット（gitignore 対象。下記参照。存在しない場合もある）

（just47 と異なり `content/` は存在しない。記事コンテンツを持たないため）

## 参照実装（`.reference/just47/`）

- just47 サイトの実機検証済みコードのスナップショット。**読んでよいし、該当箇所はコピーして流用してよい**。特に有用：問い合わせの Server Action・`public/sw.js`・レート制限・メール文面の組み立て・`env.ts`・Terraform の modules・`.github/workflows`。
- ただし**非規範**。`docs/` の仕様書と食い違う場合は必ず仕様書が正。食い違いに気づいたら報告すること。
- `.reference/` から **import しない**（必要なコードはコピーして本リポのコードにする）。ビルド・型検査の対象にも入れない（tsconfig の exclude / ESLint の ignore 対象）。
- 流用時に必ず本リポ仕様へ差し替える既知の差分：
  - **GA4・Cookie 同意（consent）関連のコードは持ち込まない**（本サイトに存在しない）
  - `content/`・markdown パイプライン・news / blog 関連は持ち込まない
  - 環境変数：just47 の `NEXT_PUBLIC_OPERATOR_URL`（aibee-lab を指す）に対し、本リポは **`NEXT_PUBLIC_PORTAL_URL`**（just47 を指す。**向きが逆**）
  - フォーム：just47 のカテゴリ選択は持ち込まない（本リポのフォームにカテゴリは無い。仕様書 §5）。文言・差出人表示名はブリーフの確定文言に差し替え
  - リソース命名（DynamoDB テーブル・S3 バケット・prefix 等は `alp007-aibee-lab` 系に）
  - OIDC の subject（リポジトリ名が異なる上、本リポは immutable subject claims の可能性。仕様書 §7）
  - デザインとページ構成（just47 の中立スタイル・古地図テーマ・ポータル構成を持ち込まない）
- リファレンスが存在しない環境では仕様書のみで実装し、必要ならオーナーに配置を依頼する。

## デザインシステム

- 見出し＝Noto Serif JP、本文＝Noto Sans JP（just47 と共通の声）。
- 配色・トーンは本サイト固有（`docs/SITE_DESIGN_BRIEF.md` に従う）。just47 の中立スタイルや「ど忘れ県」の古地図テーマを持ち込まない。
- ページ文言は `docs/SITE_DESIGN_BRIEF.md` の確定文言が正。実装の都合で勝手にコピーを書き換えない（主語・語彙に規約がある。`docs/SITE_ARCHITECTURE.md` §1）。

## Next.js 16 の注意（重要）

- 本リポジトリは Next.js 16 採用。Next 16 は破壊的変更があり、訓練データ（〜Next 15）と API・規約・ファイル構成が異なる場合がある。
- アプリコードを書く前に、同梱ドキュメント `node_modules/next/dist/docs/` の該当ガイド（特に getting-started の fonts / css / metadata / project-structure、guides の rendering-philosophy）を参照し、非推奨警告に従うこと。
