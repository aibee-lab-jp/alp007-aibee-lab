# サイト構成（アーキテクチャ）メモ — aibee-lab.jp

> アイビーラボ（AiBee Lab）コーポレートサイト（aibee-lab.jp）のリニューアル。「とりあえず47」の運営元プロフィールサイト。技術構成・運用流儀は just47 ポータル（alp006）を出発点にコピーするが、**本書は自己完結**しており、本書だけで実装・運用できる。実装は Claude Code、デザインは Claude Design、仕様は本書と `SITE_DESIGN_BRIEF.md` が正。

## 0. 本書の位置づけ（仕様書駆動・自己完結）

- 本書が本サイトの技術仕様の**唯一の情報源**。決定は「決定＋理由＋見直す合図」の形式で記録し、変更のたびに改訂履歴を更新する。
- **自己完結の原則（決定）**：just47 リポジトリの仕様書を規範として参照しない。just47 由来の実装知見のうち本サイトに効くものは、結論と理由ごと本書に取り込んである。理由：
  1. リポジトリが分かれており、Claude Code は実装時に他リポの文書を読めない（参照が規範として機能しない）。
  2. just47 側が自リポの都合で仕様を改訂するたびに、こちらの参照の生死を確認する運用は成立しない。
  3. 両サイトはデプロイも保守も独立しており、fork 後の仕様は各々の現実を記述すべき。コード（Terraform モジュール）をコピーして独立管理するのと同じ単位で、仕様書も独立管理する。
- **代償として受け入れること**：just47 側で今後得られる一般知見の改善は、本書に自動では伝播しない。取り込むかどうかは本リポで個別に判断する（デプロイが独立である以上、判断も独立が正しい）。
- 文中の「just47 で実機検証済み」等は**出自の注記**であり、参照義務を生まない（読まなくても本書だけで足りる）。
- リポジトリ間に残る依存は文書ではなく、**共有 AWS アカウント上の資源のみ**。方針と台帳を §10 に集約する。

**参照実装（リファレンスコード）の扱い（決定）**

- just47 のコード一式のスナップショットを、本リポの **`.reference/just47/`（gitignore 対象）** に置き、Claude Code の参照・流用元にする。本書の自己完結は**規範**（何を作るか）の話であり、規範を満たす**実装の具体**は just47 の実機検証済みコードを最大限流用する——同じ仕様から書き起こしても同じコードになるとは限らず、動いている実装の方が、仕様書が要約しきれない細部（終了コードの取得方法、RFC 2047 エンコード、ハイドレーション回避の初期値など）まで正確に運べるため。
- リファレンスは**非規範**。本書・ブリーフと食い違う場合は仕様書が正（流用ルールと差し替え必須の差分は CLAUDE.md に記載）。スナップショットのため just47 側のその後の変更は反映されない——取り込みは個別判断、という本節冒頭の整理と同じ。実装が一巡したら削除してよい（リポジトリ内の何もこれに依存しない）。
- 配置（just47 の checkout パスは環境に合わせる）：

```
mkdir -p .reference/just47
git -C ../alp006-just47-portal archive HEAD | tar -x -C .reference/just47
{ git -C ../alp006-just47-portal rev-parse HEAD; date +%F; } > .reference/just47/SNAPSHOT.txt
```

- `.gitignore` に `.reference/` を追加。**`tsconfig.json` の `exclude` と ESLint の ignore にも加える**（型検査・ビルド・import 解決の射程に入れない）。
- 検討して採らなかった案：just47 のコピーを初期コミットにする fork 方式（ポータルページ・content・GA4 等の削り忘れリスクと履歴の濁り。3ページ規模なら仕様書ベースの積み上げの方が安い）／git submodule・Claude Code のマルチルート起動（リポジトリ間の生きた結合が復活し、ツールの設定にも依存する）。

## 1. コンセプト / ポジショニング

- **本サイトの役割**：「とりあえず47」の運営元プロフィール。想定読者は just47 フッターの「運営」リンクから来る**非エンジニアのアプリユーザー**（滞在は数十秒〜数分）。本サイトが最も働くのは、アプリに課金を導入したとき——「お金を払っても大丈夫な相手か」の確認先。
- **受注サイトにしない**：クラウド／AI の事業内容は「売るため」ではなく「素性を示すため」の記述体で書く。料金・導入フロー・強い CTA は置かない。
- **更新しないと古びる要素を持たない**：ニュース・ブログは置かない。継続性は静的な「沿革」で示す。（見直す合図：発信したい記事が実際に複数たまったとき。その場合も置き場の第一候補は just47 側のブログ）
- **主語と語彙の規約**（エンジニアの集まりに見せ、かつ嘘をつかない）：
  - 主語は「アイビーラボ」または「私たち」。一人称単数は使わない。**正式な屋号表記は「アイビーラボ」**（確定）。英語表記 **AiBee Lab**（表記はロゴに準拠・B は大文字）はロゴ・英字文脈（ドメイン、just47 側の表記等）の補助とする。
  - 使ってよい語：「創業」「代表」。使わない語：「設立」「株式会社」「代表取締役」「社員数」「会社概要」（「会社」が法人格を連想させるため。ナビ・見出しは About Us 等の英語表記で回避する）、契約形態の語（「フリーランス」「業務委託」「正社員」）。
  - 経歴・実績は契約形態ではなく**領域の変遷**で書く。実績は業界名ベース（「大手自動車メーカーの生成AIデータ活用基盤」等）で、サービス名の羅列は一段下げる。
  - 概要（About Us）に**代表名は記載しない**（決定）。個人名の公開を避けることを優先する。代償として、App Store の販売者表記（個人名）とサイトの間で名前の突合はできなくなる。見直す合図：課金導入時に、販売者表記との整合を問う声が実際に出たとき。
  - トーン：ポエム禁止・感動の押し売り禁止・事実で組む（just47 ブリーフと同じ規約）。
- **連絡手段はフォームに一本化する（決定）**：サイトに電話番号・メールアドレスは掲載しない（電話は携帯番号のみで掲載が逆効果、メールは §5 の裸出し回避と同旨）。表記がどうしても必要な場面では `admin@aibee-lab.jp` を用いる。
- **ヒーロー（確定・案1）**：
  - キッカー：「とりあえず47」運営元
  - H1：クラウドとAIのエンジニアリングラボ
  - リード：アイビーラボは、企業のクラウド導入・インフラ構築（AWS / Google Cloud / Azure）と、AIの開発・業務導入を支援しています。大手企業の基盤づくりと同じ技術、同じ品質基準で、自社アプリ「とりあえず47」を開発・運営しています。
- **沿革（確定・2021年起点）**：

  | 年 | 内容 |
  |---|---|
  | 2021 | 創業。企業のクラウド導入支援・インフラ構築（AWS）を開始 |
  | 2024 | 生成AI基盤（RAG）の構築支援へ領域を拡大（AWS・Azure） |
  | 2025 | Google Cloud による大規模データ活用基盤の構築に参画。AI活用の開発支援・教育へ拡大 |
  | 2026 | 自社アプリ事業「とりあえず47」を開始 ※アプリ公開後に「公開」へ差し替える |

- ドメイン：**www.aibee-lab.jp を正**とし、apex（aibee-lab.jp）は www へ 301。dev は **dev.aibee-lab.jp**。just47 側の `NEXT_PUBLIC_OPERATOR_URL`（dev/prod）と一致する。
- リポジトリ：Organization `aibee-lab-jp` のプライベートリポジトリ **`alp007-aibee-lab`**（確定）。**just47 とは別リポ**。
- **Terraform モジュールは共有化しない（決定）**：just47 の `infra/modules` をコピーし本リポで独立管理する。理由：2サイト規模で共有モジュールの版管理を持つコストが利得を上回る。見直す合図：3サイト目ができたとき、または両リポのモジュールに同じ修正を2回入れる経験が続いたとき。

## 2. ページ構成・技術スタック・環境変数

**ページ**

| パス | 内容 | レンダリング |
|---|---|---|
| `/` | トップ：Hero → 事業内容 → 実績 → 沿革 → アイビーラボ（About Us）・連絡先導線 | SSG |
| `/contact` | 問い合わせ（§5） | ページは SSG、送信のみ SSR |
| `/privacy` | プライバシーポリシー | SSG |
| 404 | カスタム 404 | SSG |

- トップ1ページ＋2ページの最小構成。セクション順は「訪問者の疑問に答える順」（何者か → 何をしているか → 信頼できるか → 実在するか）。
- **カスタム 404**：Next.js 既定の 404 はデザインから浮くため独自に持つ（`app/not-found.tsx`）。見出しと短い説明は日本語、戻り先リンク（`/`・`/contact`）を置いて行き止まりにしない。`metadata` で `title` を設定する（既定だと英語タイトルが出る）。`robots` 指定は不要（HTTP 404 なので索引されない）。ヘッダー・フッターは共通レイアウトから自動で付く。
- **メタデータ・OGP は初版から整備する**：ルートレイアウトに `metadataBase: new URL(env.siteUrl)` を設定（`NEXT_PUBLIC_SITE_URL` から組み立てる。無いと og:image が相対パスのまま出力され SNS 共有時に画像が出ない）。`metadataBase` は相対 URL の解決基準を与えるだけで `canonical` や `og:url` を自動生成しないため、各ページで設定する。共通 OG 画像はブリーフのアセットとして作成する。
- **robots.txt / sitemap.xml は Next の Metadata Routes で生成する**（`app/robots.ts`・`app/sitemap.ts`）。sitemap の対象は `/`・`/contact`・`/privacy` の3件（URL は `NEXT_PUBLIC_SITE_URL` から組み立てる）。dev の非索引化は配信層の `X-Robots-Tag`（§7）が担うため、robots 側に環境分岐は持たない。
- **地図（Google マップ等）の埋め込みは行わない（決定）**：外部スクリプトと Cookie が発生し、「当サイトは Cookie を使用しません」の宣言（本節の GA4 不採用の決定を参照）と両立しないため。会社概要の所在地はテキストで記載する。

**技術スタック**

| 層 | 採用 |
|---|---|
| フロントエンド | Next.js 16（App Router）＋ TypeScript ＋ Tailwind v4 |
| ランタイム | Node.js 24（開発・配信とも統一。`.nvmrc`＝`24`、Lambda は nodejs24.x） |
| レンダリング | フォーム送信以外は全て SSG。問い合わせ送信のみ Server Action（SSR）。ISR の常時インフラは組まない |
| IaC | Terraform 1.15.7 |
| CI/CD | GitHub Actions（plan 自動／apply 手動の2本立て。§8） |
| AWS | S3 / CloudFront / Lambda（server・image）/ DynamoDB / SES / Route53 / ACM |
| 環境 | dev / prod（別 AWS アカウント。**just47 と同一の各アカウントに同居**） |

- **バージョン方針**：Next.js 16 採用（15 はサポートが短命なため。16 は Active LTS）。**パッチバージョンは `package.json` で完全固定**（キャレット無し）。更新は意図的に行い、そのつど本書に記録する。初期バージョンは just47 で確定済みの一式（next 16.2.11、@opennextjs/aws 4.0.3 ほか）を採用する。@opennextjs/aws を上げる際は peerDeps の下限により next と同時更新になる点に注意。
- **Node 24 の根拠**：nodejs20.x は 2026-04-30 に Phase 1 非推奨（関数作成ブロックは 2026-08-31）。nodejs24.x は現行サポート（EOL 2028-04）で、ローカル・CI・Lambda を一致させる。
- **npm audit の方針**：初回セットアップ時に本リポで棚卸しし、受け入れる指摘は「理由＋見直す合図」付きで本書に記録する。判断の枠組み：修正版が存在しない／ビルド時ツールのみで実行時に外部入力を受けない／Lambda 上の実体が別系統（§7 の sharp）——のいずれかに該当すれば理由をもって受け入れる。just47 と同じ依存構成のため、同種の指摘（brace-expansion・postcss・sharp）が出る見込み。

**環境変数の管理場所（原則・例外なし）**

> **GitHub Environments に置くのは AWS の認証情報（`AWS_ROLE_ARN`）のみ。それ以外の環境依存の値はすべて Terraform が持ち、CI はビルド前に `terraform output` から取得する。**

- 認証情報だけ GitHub に置くのは、AWS に入るために必要な値を AWS の中に置いても取り出せないため（技術的に避けられない唯一の例外）。
- 同じ値を GitHub と Terraform の両方に書くと、片方だけ変えたとき整合が崩れ、しかも気づけない。**同じ値は1箇所**の原則を例外なく通す。新しい環境依存の値が出たら「Terraform に書く」だけで、置き場を考えない。
- 代償：CI にビルド前の取得ステップが増える。値の確認は `terraform output` か AWS コンソールで行う。
- **【重要】`terraform output` は state に保存済みの値しか返さない**。新規追加した output は apply まで state に入らないため、plan しか行わない1本目のワークフローでは初回に失敗する。対処：`terraform output -raw` を試し、取得できなければ **`terraform console` で tfvars から直接評価するフォールバック**を持たせる（console は state 非依存。情報源は同じ tfvars なので値は一致する）。**prod 構築時も state が空から始まるため同じ状況が起きる**。
- CI での取得は `$GITHUB_ENV` に流し込む（「output 名 ↔ 環境変数名」の対応を1箇所にまとめるため）。したがって**ビルドより前に AWS 認証と `terraform init` が必要**。

**環境変数（環境ごとの設定値）**

| 変数 | dev | prod | 用途 |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://dev.aibee-lab.jp` | `https://www.aibee-lab.jp` | `metadataBase`、`serverActions.allowedOrigins` の導出元、確認メール署名 |
| `NEXT_PUBLIC_PORTAL_URL` | `https://dev.just47.jp` | `https://www.just47.jp` | 「とりあえず47」への導線（just47 側 `NEXT_PUBLIC_OPERATOR_URL` の鏡像。dev は dev 同士で閉じる） |
| `NEXT_PUBLIC_ENV` | `dev` | `prod` | dev 限定の挙動。URL 生成には使わない |

- `NEXT_PUBLIC_` はビルド時にバンドルへ埋め込まれる（値の変更にはリビルドが必要）。**ブラウザから読めるため秘匿値を入れてはならない**。
- コードに URL をハードコードしない。環境名から URL を組み立てる分岐も書かない。値は環境ごとに完成した URL をそのまま入れる。
- 値の出どころは `terraform.tfvars`。outputs 命名は `app_<環境変数のスネークケース>`。サイト URL は `site_domain` から組み立て、URL 文字列を tfvars に重複して書かない。これらは**アプリに渡す設定値**なので、モジュールではなく環境ルートに直接置く。
- 参照は `src/lib/env.ts` に集約し、各所で `process.env` を直接読まない。**必須変数が欠けたらビルドを失敗させる**（渡し忘れると `undefined` のまま配信され、リンクが壊れたまま気づけない）。検証ライブラリは追加せず標準の TypeScript で実装する。
- `.env.local`＝ローカル開発用に dev の値（gitignore・手書き）。`.env.example`＝変数名の雛形をコミット（実値は書かない）。`.env.production` 等の環境別ファイルは作らない。
- **GA4 は導入しない（決定）**。本サイトの判断基準は「信頼度が上がるか」であり、Cookie 同意バナーは信頼を上げず、静かな1ページサイトにはノイズになる。PV を計測する動機もない。これにより同意バナー・consent 実装・GA 用変数が丸ごと不要になり、**「当サイトは Cookie を使用しません」と privacy に明記できる**（それ自体が小さな信頼材料）。見直す合図：計測が必要になったとき（その際も同意前にタグを読み込まない方式を採ること）。

## 3. アーキテクチャ図

**ランタイム（配信）**

```
ユーザー
  │
  ▼
CloudFront ──(/_next/static・sw.js・画像など)──▶ S3（静的アセット）
  │
  └─(その他＝動的)──▶ Lambda(SSR / OpenNext) ──▶ DynamoDB（問い合わせ保存・レート制限）
                         └ Server Actions      └▶ SES（確認・通知メール）
ドメイン: Route53 + ACM(us-east-1) → CloudFront
```

**デプロイ（CI/CD・ワークフロー2本立て）**

```
[1本目 plan] develop へ push（自動）
  1. 既存の tfplan artifact を削除（未適用 plan は常に1つ以下）
  2. terraform output で環境変数取得 → next/open-next build（Linux ランナー）
  3. terraform plan -out=tfplan（ログ出力・差分判定）
  4. tfplan / Lambda zip / .open-next/ を artifact 保存、run ID をサマリに出力
  ※ ここで停止

  ↓ オーナーが plan を確認

[2本目 apply] 手動実行（入力なし）
  5. artifact を自動取得（取得元 run ID / SHA をログ・サマリに出力）
  6. terraform apply tfplan（確認した plan をそのまま適用）
  7. aws s3 sync（assets / cache）→ CloudFront invalidation

環境: dev=develop / prod=release（state・配信を分離、dev は noindex＋Basic認証）
```

## 4. レンダリング戦略とコンテンツ

- 全ページ SSG。問い合わせ送信のみ Server Action（`'use server'`）＝ SSR Lambda。`/contact` ページ自体は静的（HTML→S3）のままで、送信 POST のみ server function が処理する（この混在構成は just47 の dev で GET/POST とも実機検証済み）。
- **markdown パイプラインは持たない**。ニュース・ブログが無いため、`content/` ディレクトリ・MDX 関連の仕組みは作らない。
- ページ文言はコード内の定数（例：`src/lib/site-content.ts`）に集約する。**文言の正は `SITE_DESIGN_BRIEF.md` の確定文言**であり、実装側で勝手に書き換えない。
- ISR は組まない。「`revalidate` を書く（機能）」と「キャッシュ基盤を provision する（インフラ）」は別物であり、静的コンテンツのみの本サイトに必要がない。OpenNext 側の無効化設定は §7。

## 5. 問い合わせフォーム

**設置する（決定）**。判断基準はリソースではなく信頼度：(1) 一般ユーザーには「フォーム＝組織の窓口」というパターン認識があり、メールアドレスの裸出しは個人サイトの記号になる（スマホではメールアプリ未設定だと mailto が開けず、その体験自体が悪印象）。(2) 課金導入後、「運営元に直接届く窓口が存在する」ことが支払い前の安心材料になる。(3) just47 の `/contact` はカテゴリ構成からしてアプリ窓口であり、運営元宛の連絡（お金・権利関係等）の受け皿としては半端。

### 送信処理（Server Action・3つの動作）

- (a) **DynamoDB に問い合わせ全文を保存**（姓・名・メール・件名・本文）。これが**一次記録＝受付の成否**。
- (b) **送信者へ自動返信メール（SES）**：受付の確認。
- (c) **運営への通知メール（SES）は件名のみ**（本文は載せない）。運営がネガティブな本文を直接読まずに新着と概要だけ把握できる緩衝層。本文は DynamoDB を見る。
- (b)(c) は **best-effort**：送信に失敗してもアクションは失敗させず、ログ（CloudWatch）に記録するのみ。保存が成功していればサンクスを表示する。理由：保存成功後にメール一時障害でエラーを返すと、ユーザーが再送して DynamoDB に重複が生じる。

### POST の配送経路（Service Worker 方式）

配信は CloudFront → Lambda Function URL（OAC・AWS_IAM）構成のため、**POST/PUT では CloudFront OAC が body を署名せず、クライアントが body の SHA-256 を計算して `x-amz-content-sha256` ヘッダーに付ける必要がある**（AWS 公式仕様。Lambda は署名なしペイロード不可）。無対策だと Server Action の送信が 403 になる。Service Worker で解決する（just47 の dev で実機検証済み）。

- `public/sw.js` が **同一オリジン＋POST＋`next-action` ヘッダー**の3条件で Server Action の送信のみを捕捉し、body の SHA-256 を付与する。`install` で `skipWaiting()`、`activate` で `clients.claim()`。キャッシュ戦略・オフライン対応は実装しない。
- 登録は `navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })`（SW スクリプトの更新が HTTP キャッシュで遅延しないように）。
- CloudFront は `sw.js` を S3 オリジンへ向ける behavior を持ち、**キャッシュ無効**（Managed-CachingDisabled）。エッジに旧 `sw.js` が残ると更新が届かないため。
- **CSRF**：`next.config.ts` の `experimental.serverActions.allowedOrigins` を **`NEXT_PUBLIC_SITE_URL` から導出する**（ハードコードしない。dev/prod の分岐も不要になる）。`*.cloudfront.net` のワイルドカードは他人の CloudFront も通るため使わない。独自ドメイン適用後、CloudFront 既定ドメインからのフォーム送信はブロックされる（配信自体は続く）＝動作確認は独自ドメインで行う。
- **SW 未制御時のフォールバック**：送信前に `navigator.serviceWorker.controller` を確認し、制御されていなければ送信せずエラー表示する（黙って 403 にしない）。再読み込みで解決しうる旨を案内する。
- **SW 非対応ブラウザ**：`"serviceWorker" in navigator` が false の環境では、ページを開いた時点で判定し**フォームを描画せず案内を表示**する（使えないフォームに入力させない）。文言は未制御時と区別する——非対応環境は再読み込みしても解決しないため、再読み込みを促さず最新版ブラウザを案内する。**メール等の代替受付は用意しない**（DynamoDB 一次記録の設計が崩れ、運用も二経路になる）。
- **実装知見（ハイドレーション不一致の回避）**：`navigator` はクライアントでしか触れないため、状態の初期値を `null`（未判定）にして「サーバー描画＝クライアント初回描画（＝フォーム）」を一致させ、判定は `useEffect` で行う。

### 送信レート制限

WAF も API Gateway も採らないため、Server Action の中で実装する（just47 の dev で「1分以内の4件目が拒否され、1分経過後に復帰する」ことを実機確認済みの方式）。

- **判定単位は IP**（メールアドレスは偽装が容易）。**閾値は「1分に3件」かつ「1時間に20件」の2段**。短い窓は連投を、長い窓は異常な総量を止める天井（1分だけだと「1分2件」の維持で1時間120件に達しうる）。実装は1時間分を1回 Query し、そのうち直近1分を数えれば両方を判定できる。
- **記録は専用テーブル**（問い合わせ保存用と分ける）。理由：(1) 問い合わせ本文と一緒に IP を無期限で残さない、(2) TTL で自動削除できる（判定にしか使わない）。
- **IP はソルト付きハッシュで保存**。ソルト無しでは IPv4 空間（約43億）の総当たりで復元でき、「復元できない」を満たさない。**ソルトは Terraform で生成し Lambda の環境変数で渡す**（リポジトリにもコードにも入らず手作業も不要。値は state に残るが state バケットは非公開で許容。ローテーションはリソース再作成）。効果は「テーブル単独流出」時に限られる点は理解の上で、実装コストが小さいため入れる。SSM/Secrets Manager 取得は本用途には過剰。
- **IP の取得元は `CloudFront-Viewer-Address`**。CloudFront がエッジで自ら値を決めるため偽装できない。**`X-Forwarded-For` は使わない**（クライアントが自由に付けられ、先頭を信用すると制限を無効化できる）。値は `IP:ポート` 形式（IPv6 は `[2001:db8::1]:46532`）なので**必ずポートを除去する**（付けたままだと同一 IP が別扱いになり制限が機能しない）。既定 behavior のオリジンリクエストポリシー（Managed-AllViewerExceptHostHeader）で転送されるが、**届くかはデプロイ後に必ず実機確認する**——届かない場合 fail open で静かに素通りし、エラーも出ない。
- **記録するのは受付が成立した送信のみ**（拒否した送信を記録すると窓が延び続け復帰できなくなる）。判定は**ハニーポット・バリデーションの後、DynamoDB 保存の前**。`expiresAt` は保存時刻＋2時間（TTL 削除は遅延しうるため判定窓より長く）。境界：1分の4件目・1時間の21件目から拒否。
- 拒否時の表示は「送信が集中しています。しばらく時間をおいてからお試しください」程度にとどめ、**閾値や残り時間は明かさない**。
- **判定に失敗したら送信を通す（fail open）**。レート制限は認証ではなくスパム対策であり、障害時に正常な利用者を締め出す方が損失が大きい。失敗はログに記録。
- 共有 IP（NAT・CGNAT）の誤爆は、この閾値では「同一 IP から1分に3人／1時間に20人」が必要で、本サイトの規模では起こらない。
- **動作確認の手順**：1分窓のテストは「1分以内に4件」送る必要がある（普通に入力しながらだと1件20〜40秒かかり窓から外れ、正しい挙動が不具合に見える）。タブを4つ開いて入力を済ませ、送信だけ連続で押す。新しいタブは SW 未制御の場合があるため再読み込みしてから送る。切り分けはレート制限テーブルの scan から：記録が無い→IP 取得失敗の疑い／`ipHash` が同一→送信間隔を見る／バラバラ→ポート除去漏れの疑い。

### メール

- **文面は SES テンプレートではなく TS（`src/lib/contact-service.ts` 相当）で組み立てる**。理由：テンプレートのプレースホルダは変数名のズレを検出できず空欄のまま送信される（TS なら型とビルドで落ちる）／ローカルで実物を確認できる／ラベル変換や分岐を1言語で完結できる。文面生成は独立した関数にまとめ、将来テンプレートへ移すコストを抑える。見直す合図：文面を頻繁に変えたくなった／複数箇所で共有したくなったとき。
- **確認メール（送信者宛）の構成**：宛名／受付の挨拶／**受付内容の控え**（件名・本文）／今後について（「内容を確認のうえ、必要に応じて返信」。○営業日以内といった期限は書かない）／送信専用で返信できない旨／心当たりがない場合の案内／署名（サイト URL 含む）。控えを載せるのは、送った内容が反映されていること自体が正規メールの根拠になるため。
- **差出人の表示名**：「アイビーラボ お問い合わせ窓口」（確定）。日本語表示名は SDK が自動エンコードしないため、**RFC 2047 の encoded-word 形式で自前エンコードする**（未エンコードだと受信箱で文字化け）。
- 送信元：dev `no-reply@dev.aibee-lab.jp` ／ prod `no-reply@aibee-lab.jp`（返信不要が明確で、ドメイン検証だけで送信できる）。通知先：`admin@aibee-lab.jp`。問い合わせへの返信は運営が admin@ から直接行う。

### SES の identity・サンドボックス

- ドメイン identity：dev は `dev.aibee-lab.jp`、prod は `aibee-lab.jp` を**本リポで新規作成**（Easy DKIM。CNAME 3本は dns モジュールの Route53 ゾーンに作成。DKIM トークンは apply 時に確定するため `count` は固定本数 3 をリテラル指定し、plan が apply 依存にならないようにする）。
- **`admin@aibee-lab.jp` の email identity（§10 の共有資源）**：**どちらのリポの Terraform でも作らない**（Terraform 管理外）。dev アカウントは作成・verify 済み。prod アカウントは prod 構築時に CLI で作成し、verify リンクを手動クリックする（§9 ステップ2、コマンドは §10）。本リポの送信コードは宛先アドレスを tfvars 由来の設定値として受け取るだけで、identity リソースへの参照は持たない。
- **サンドボックス**：dev は解除しない（verify 済みアドレス宛なら送信でき、フォームの (b)(c) を通しで確認できる）。**prod は必須**（実ユーザーが任意のアドレスで送信するため）。申請には実在サイトの URL が要るので、**www.aibee-lab.jp のカットオーバー後すぐ申請する**。アカウントが just47 と共通のため、解除1回で just47 分もカバーされる（§10）。

### 本サイト固有のフォーム仕様

- **役割分担の明示**：フォーム冒頭に「アプリの不具合・ご要望は とりあえず47 のお問い合わせへ」の誘導を置く（リンク先は `NEXT_PUBLIC_PORTAL_URL` から組み立てる）。
- **カテゴリ選択は設けない（決定）**：受け付けるのはアイビーラボ宛の連絡のみで、アプリの不具合・要望は冒頭の誘導が just47 へ流すため、分類の必要がない。just47 実装の流用時はカテゴリ関連を削る（CLAUDE.md の差分ホットスポット）。
- フォーム項目は 姓・名（必須）／メール（必須）／件名（必須）／本文（必須）＋送信後サンクス表示。ハニーポット項目を1つ持つ（検出時は受付せず記録もしない）。
- **privacy の記載事項**：問い合わせフォームで預かる情報（DynamoDB 保存・SES 送信）／スパム対策として IP をハッシュ化し一時的に保持（1時間程度で自動削除）すること／AWS でのホスティング／**Cookie を使用しないこと**／問い合わせ先。

## 6. 解析

導入しない（§2 の決定を参照）。

## 7. インフラ（OpenNext ＋ Terraform）

**Terraform 管理対象**：S3（静的アセット）／CloudFront（behaviors・レスポンスヘッダーポリシー・Functions）／Lambda（server・image）／Route53・ACM（CloudFront 用証明書は **us-east-1** 必須）／SES／IAM（Lambda 実行ロール・GitHub Actions 用 OIDC ロール）／DynamoDB（問い合わせ保存・レート制限の2テーブル。レート制限用は TTL 属性 `expiresAt`、PITR 無し、権限は `Query`・`PutItem` のみ）。

**初手で組まないもの（意図的）**：ISR 用 DynamoDB／SQS、WAF、API Gateway。OpenNext 記述子に載る4関数のうち**デプロイするのは server と image の2関数のみ**（warmer は配信に不要、revalidation は SQS を作らないため不活性）。

**OpenNext 設定（`open-next.config.ts`）**：`default.override.tagCache: "dummy"`／`default.override.queue: "dummy"`／`dangerous.disableTagCache: true`（ISR 用 DynamoDB のシード関数まで出力から消すために必要）。`incrementalCache` は既定の `"s3"` のまま（SSG 主体でのダミー化は非推奨。S3 は静的配信でどのみち必要）。`disableIncrementalCache` は設定しない（SSG を壊す）。

**Terraform の組み方**：既製の OpenNext 用モジュールは使わず**自前の最小構成**で組む（コピー元は just47 の `infra/modules`）。リソース定義は `modules/` に1セットのみ、環境差は各環境の `backend.hcl` と `terraform.tfvars` の2ファイルだけが持つ。

```
infra/
├── modules/
│   ├── hosting/   # S3+CloudFront+server/image Lambda+OAC+behaviors+エイリアスA/AAAA
│   ├── contact/   # DynamoDB(2テーブル)+SES(ドメインID/DKIM/通知先)+IAM
│   ├── dns/       # Route53ホストゾーン+ACM+検証レコード+validation
│   └── cicd/      # GitHub Actions 用 IAM ロール（OIDCプロバイダは§10参照）
├── environments/
│   ├── dev/       # versions.tf / providers.tf(ap-northeast-1+us-east-1エイリアス) /
│   │              # backend.hcl★ / main.tf / variables.tf / terraform.tfvars★ / outputs.tf
│   └── prod/
└── scripts/
    └── create-state-bucket.sh   # state用S3をTerraform管理外で作成
```

- **モジュール間の依存は環境ルートで一方向にする**：hosting と contact は素直に繋ぐと循環する（テーブル名は contact が作り、権限は contact が hosting のロールに足し、環境変数は hosting の Lambda に注入するため）。値は環境ルートで確定して両モジュールへ渡す。IAM ロールは hosting 側の1本に contact から権限を足す（二重に作らない）。
- **dns と hosting の分担（循環回避のため一意に決まる）**：dns＝ホストゾーン・ACM 証明書・検証レコード・`aws_acm_certificate_validation`（**この待ちが無いと CloudFront が未発行証明書を参照して apply が失敗する**）。hosting＝CloudFront（`aliases`・`viewer_certificate`）と CloudFront へのエイリアス **A/AAAA 両方**のレコード（CloudFront は既定で IPv6 有効のため AAAA が無いと IPv6 環境から引けない）。
- **【重要】ホストゾーンの扱いは dev と prod で異なる**（§9 ステップ0）：
  - **dev**：`dev.aibee-lab.jp` のゾーンを dev アカウントに**新規作成**（Terraform 管理）。NS 4本は prod アカウントの現行ゾーンへ**手作業で1回**登録して委譲する（Terraform はクロスアカウントで書けないため）。
  - **prod**：`aibee-lab.jp` のゾーンは**既に prod アカウントに存在し、WorkMail の MX を含む**。**新規作成せず `data "aws_route53_zone"` で参照**し、レコードのみ作成する（新規作成は NS の変更＝レジストラ変更＝メール断のリスクを招く）。ゾーン自体は Terraform 管理外の資源として扱う（§10 と同じ理屈）。変数でモジュールの挙動（作成／参照）を切り替える。
- **state**：S3 backend ＋ S3 ネイティブ lockfile（`use_lockfile`。ロック用 DynamoDB は作らない）。接続値は環境別 `backend.hcl` を `init -backend-config` で渡す。state バケットは各アカウントに `alp007-aibee-lab-tfstate-<env>-<account_id>` の流儀で新設。
- **`terraform.tfvars` はコミットする**（`backend.hcl` も同様）。中身はドメイン名・メールアドレス・命名 prefix といった公開情報のみで、ignore すると複数マシン・CI で値が失われる実害の方が大きい。CI では checkout でファイルが存在し Terraform が自動読込する。**秘匿値は tfvars に書かない**——必要になったら Secrets Manager / SSM で管理し Terraform は参照のみ、変数・出力は `sensitive` を付ける（state には変数値が平文で残る性質は理解しておく）。
- **唯一の例外：dev の Basic 認証の認証情報は tfvars に置く**。理由：(1) 保護対象が「未公開コンテンツを関係者以外に見せない」程度で被害が限定的、(2) CloudFront Functions は外部サービスを呼べず、値はどのみち関数コードに平文で載る（コンソールで読め state にも残る）ため、隠しても実効的な保護が増えない。**tfvars の該当箇所に例外である旨と理由をコメントで明記する**。例外を増やす場合も同様に理由を書き本書に記載する（無言で増やさない）。パスワードにコロンは使わない（Basic 認証の連結子のため）。

**cicd（GitHub Actions 用 IAM）**

- **OIDC プロバイダは作らない（§10 の共有資源・Terraform 管理外）**：1アカウントに同一 URL のプロバイダは1つしか持てず、複数プロジェクトが共有する。本リポは `data "aws_iam_openid_connect_provider"`（URL 指定）で参照し、**ロールのみ作成**する。dev アカウントには作成済み。prod アカウントは prod 構築前に CLI で作成する（コマンドは §10）。
- **信頼ポリシーの sub は environment ベース**：ジョブが `environment:` を参照すると subject が `ref` ベースから `environment` ベースに変わるため、`repo:aibee-lab-jp/alp007-aibee-lab:environment:dev` の形式で書く（`ref:refs/heads/...` で書くと認証が失敗する。just47 で実証済み）。**結果としてブランチ制限は GitHub Environments の Deployment branches が唯一の担保**になる（AWS 側では判定できない）。
- **【本リポ固有の注意】immutable subject claims**：2026-07-15 以降に新規作成されたリポジトリは subject が `repo:owner@ID/repo@ID:...` の**ID 入り書式**になる見込み（just47 は既存リポのため標準書式）。本リポは新規作成なのでこの書式に該当する可能性が高い。**初回に実際の subject を確認してから信頼ポリシーを書くこと**（just47 の sub 文字列を写すと認証に失敗しうる）。
- 権限は**サービス単位のワイルドカード**（`s3:* cloudfront:* lambda:* iam:* dynamodb:* ses:* route53:* acm:* logs:* sts:*`、Resource `*`）。Terraform は apply のたびに大量の Describe/Get/List を行いアクション単位の列挙が現実的でないため。守りは信頼ポリシー（repo＋environment 限定）と GitHub 側のブランチ制限が担う。dev で必要権限を実践的に確定し、その内容を prod にも適用する。

**hosting の CloudFront まわり**

- **エイリアスは変数化し、prod の初回 apply はエイリアス無しで行う**。同一ドメイン名は同時に1ディストリビューションにしか付けられず（CNAMEAlreadyExists）、旧サイト稼働中はエイリアス付き apply が失敗するため。既定ドメイン（*.cloudfront.net）で動作確認まで済ませ、カットオーバー時（§9）にエイリアスを付与する二段階。
- **apex → www の 301**：CloudFront Function（viewer request）で Host を判定してリダイレクト。
- **dev の noindex**：CloudFront のレスポンスヘッダーポリシーで `X-Robots-Tag: noindex, nofollow` を付与（配信層で付けることで HTML 以外にも一律に効く）。prod では付けない（変数で切替）。
- **dev の Basic 認証**：CloudFront Functions（viewer request、ランタイム 2.0、**全 behavior に割り当てる**——割り当てのない behavior は素通りするため）。**base64 は関数内で扱わない**：期待する `Authorization` 値を Terraform の `base64encode()` で組み立てて `templatefile` で注入し、関数は文字列比較のみを行う（ランタイム 1.0/2.0 で文字列 API が異なり、関数内 base64 はランタイム依存になるため）。認証失敗時は 401＋`www-authenticate`。認証情報の変数は `default = ""`＋`sensitive = true` とし、**関数リソースの `precondition` で「有効時のみ非空」を強制**（必須変数にすると prod にダミー資格情報を置くことになる）。prod では無効。
  - 既知の懸念：SW 経由の POST に Basic 認証の `Authorization` が付かない可能性（Firefox に未解決の不具合報告あり。Chrome 系では just47 で問題なく通過を確認済み）。dev 限定の仕組みのため、問題が出たら Server Action の behavior だけ認証から除外するか一時無効化で足りる。
- **Lambda Function URL の権限（重要）**：server/image とも `authorization_type=AWS_IAM`、CloudFront は OAC（type=lambda / sigv4 / always）で署名し Function URL は公開しない。**2025年10月以降に作成された Function URL は、リソースベースポリシーに `lambda:InvokeFunctionUrl` と `lambda:InvokeFunction` の両方が必要**（片方だけだと 403 になり CloudWatch にログすら出ない）。`aws_lambda_permission` を関数ごとに2本付与する。
- **SES の IAM 権限**：`ses:SendEmail` の Resource は `arn:aws:ses:<region>:<account>:identity/*`（region/account はデータソースから組み立てる）。送信元ドメイン ID だけに限定すると **SES は宛先側 identity にも認可チェックを行うため AccessDeniedException** になる。prod のサンドボックス解除後は絞り直しを再検討。
- **S3 アセット投入**：assets/cache は数百ファイルのビルド成果物のため `aws s3 sync` で投入（CI の独立ステップ）。hosting の outputs に sync コマンドを出力する。

**sharp は2系統ある（画像最適化の前提知識）**

| 系統 | 誰が入れるか | 備考 |
|---|---|---|
| ルートの `node_modules/sharp` | next の optionalDependency | `npm audit` の対象 |
| `.open-next/image-optimization-function/…/sharp`（**Lambda で動く実体**） | **OpenNext が独立に `npm install`**（バージョンをハードコード） | lockfile 管理外・audit 対象外 |

- next を更新しても Lambda 側の sharp は変わらない。上げる場合は配布形態が変わるため Linux ビルドの再検証が必須。
- `images.remotePatterns` 未設定のため `/_next/image` は自サイトの画像しか処理せず、libvips 系 CVE を突く経路がない。**`remotePatterns` を設定する場合はこの前提が崩れる**ので sharp の更新を再検討すること。
- image 関数の sharp は **linux-arm64 ビルドが必要**なため、実配信用のビルドは必ず CI（Linux ランナー）で行う（§8）。

## 8. CI/CD と環境

**基本方針**：GitHub Actions で dev / prod を自動化。**`terraform apply` は必ず人が plan を確認してから実行する**（dev でも崩さない。dev で崩れた運用は prod でも崩れる）。

| ブランチ | 環境 | 起動 |
|---|---|---|
| `develop`（デフォルトブランチ） | dev | push で plan が自動起動 |
| `release` | prod | push で plan が自動起動 |

- ワークフローは**すべて `develop` に置く**（自動起動は対象ブランチ条件で分かれる。`workflow_dispatch` の手動実行の口はデフォルトブランチに存在して初めて開く）。`release` へはマージで運ぶ。
- **環境固有のものを `release` ブランチで作業しない**。環境ブランチに環境固有の設定を持たせるのは設定ドリフトを生むアンチパターンであり、環境の違い（恒久的な差異）はブランチではなく設定（`environments/<env>/` のフォルダ・tfvars・GitHub Environments）で表現する。hotfix は例外だが必ず `develop` へ back-port する。
- **GitHub Environments**：`dev` / `prod` を作成。Variables は **`AWS_ROLE_ARN` のみ**（§2 の原則）。**Deployment branches を dev→`develop`、prod→`release` に制限する**（OIDC subject にブランチ情報が無いため、ここが唯一のブランチ担保）。デプロイ承認（required reviewers）はプライベートリポジトリでは Enterprise 限定のため使えない——代わりに plan/apply の2本立てが承認の役割を担う。
- 両ワークフローで `environment:` を指定する（Variables 参照とブランチ制限を効かせるため。これにより OIDC subject が environment ベースになる。§7）。
- `concurrency` を同一グループにして plan と apply を直列化。permissions は最小限（plan＝`contents: read` / `id-token: write` / `actions: write`、apply＝`contents: read` / `id-token: write` / `actions: read`）。Terraform バージョンは両ワークフローで揃える。
- `.github/workflows/**` は `paths-ignore` に入れ、ワークフローだけの変更では自動起動しない（検証は手動実行で。`src/**` や `infra/**` と同時変更なら通常どおり起動する）。
- **パスによる infra / site の分離は行わない**：Lambda のコードが Terraform 管理下にあり、`src/**` の変更が `source_code_hash` の差分として現れるため、`src` だけ変えても apply が必要になる。

**1本目（plan・push で自動）**

1. 既存の plan artifact を削除（GitHub REST API。**未適用の plan は常に1つ以下**を保つ＝取り違えが構造的に起きない）。
2. checkout → Node（`.nvmrc`）→ 依存インストール → **AWS 認証 → `terraform init` → `terraform output` でビルド用環境変数を取得し `$GITHUB_ENV` へ**（初回は console フォールバック。§2）→ **`npx open-next build`**。**Linux ランナー必須**（sharp の linux-arm64 を得るため）。
3. `terraform plan -out=tfplan`。差分の有無は **`-detailed-exitcode`** で判定（0＝差分なし／2＝あり／1＝エラー。plan の間だけ `set +e` にし `${PIPESTATUS[0]}` で取得——`tee` によるログ出力と両立させるため）。
4. artifact に **tfplan／Lambda の zip／`.open-next/`** を保存。zip が必須なのは、保存 plan の apply でも**apply 時に zip の実体を読んでアップロードする**ため（別ランナーに実体が無いと失敗する）。`.open-next/` はドット始まりのため `include-hidden-files: true`。`.terraform/` は含めない（2本目で init し直す）。
5. ジョブサマリに run ID と差分の有無を出力（2本目の取得元 run ID と突き合わせて照合するため）。

**2本目（apply・手動実行、入力なし）**

6. plan artifact を名前で自動特定して取得（常に1つ以下なので一意。無ければ失敗＝plan がまだ無い）。取得元の run ID / SHA をログとサマリに出力。
7. `terraform init` → **`terraform apply tfplan`**（引数なしで再 plan させない。**確認した内容と適用内容を必ず一致させる**のが要点。state が変化していれば Terraform が拒否する＝正しい挙動）。この方式は GitHub の承認機能より厳密（承認から apply の間に state が変わると差分がズレる問題がない）。
8. `aws s3 sync`（assets / cache）→ CloudFront invalidation。バケット名・distribution ID は `terraform output -raw` から取得（`hashicorp/setup-terraform` は `terraform_wrapper: false` が必要）。

**運用上の重要事項**

- **【重要】CI 稼働後は手元から `terraform apply` しない。** hosting の `archive_file` はローカルの `.open-next/` を zip 化するため、手元 apply では macOS ビルドの Lambda が配信され、CI で入れた Linux ビルドが巻き戻る（image 関数の sharp が darwin 版に戻り動かなくなる）。`NEXT_PUBLIC_*` もビルド時埋め込みのため、設定変更もリビルドなしには反映されない。**インフラだけの変更でも CI を経路とする**。例外は cicd のように CI 自身が依存するもの（初回は手元 apply → GitHub 設定 → ワークフロー設置、の順）と CI 復旧時のみ。復旧後は CI を1回通して成果物を正しい状態に戻す。
- **ビルドコマンドは `npx open-next build` のみ**。`npm run build` を別途走らせない——open-next build は内部で `next build` を呼び、しかも standalone モード無しの1回目の出力は完全に捨てられる（時間が倍・外部依存の失敗機会も倍になるだけ）。
- **Google Fonts の取得失敗**：`next/font/google`（Noto Serif JP / Noto Sans JP）はビルド時に外部取得するため、CI で稀に 404 で落ちることがある。まず再実行。頻発するならフォントをリポジトリに置いて `next/font/local` へ移行する。
- `.github/workflows/` を含む push には PAT の `workflow` スコープが必要。

**アクションのバージョン（初期値・Node 24 対応済みの最小メジャー）**

| アクション | バージョン |
|---|---|
| `actions/checkout` | v5 |
| `actions/setup-node` | v5 |
| `aws-actions/configure-aws-credentials` | v6 |
| `hashicorp/setup-terraform` | v4 |
| `actions/upload-artifact` | v6 |
| `actions/download-artifact` | v7 |

- 上げ幅は「`runs.using: node24` になる最も古いメジャー」まで。最新に追従しない。**Node 24 対応の判定は該当タグの `action.yml` の `runs.using` 実値で行う**（リリースノートの文言は当てにならない。upload と download で必要メジャーが違う点にも注意）。`download-artifact` v8 は採らない（node24 と無関係な挙動変更で失敗が増える）。メジャータグは可変のため v5 系内の更新は自動で入る（SHA 固定は採らない）。

## 9. 移行（カットオーバー）計画

現行 aibee-lab.jp（Bootstrap＋Svelte、S3/CloudFront 構成）からの切替。**関門は DNS ではなく CloudFront エイリアスの排他制約**（§7）。

- **ステップ0：現状把握（完了・2026-08-30）**
  - **現行リソースはすべて prod アカウント**（Route53 ホストゾーン・CloudFront・S3・問い合わせフォームのバックエンド）。dev アカウントには現行資産が無い。
  - レジストラは**バリュードメイン**（just47.jp と同じ）。
  - **メール関連レコード：MX のみ（`10 inbound-smtp.us-west-2.amazonaws.com.`）。SPF・DKIM・DMARC は無し。**
    - `admin@aibee-lab.jp` の受信は **AWS WorkMail**（us-west-2）で運用している。**本プロジェクトでは一切触らない**（MX レコード・WorkMail 組織・us-west-2 の SES 受信設定とも Terraform 管理外）。送信用ドメイン identity は ap-northeast-1 に別途作成するため衝突しない（SES の identity はリージョンごとに独立）。
    - WorkMail は将来的に別手段へ移管する予定だが、本プロジェクトの範囲外（移管時に SPF/DMARC の整備もあわせて検討する）。
  - **プロジェクトの結論**：
    1. **ゾーン移管は不要**（現行ゾーンが既に prod アカウントにある）。**レジストラのネームサーバー設定は最後まで触らない**——メール断の最大リスクを移行から排除できる。
    2. **prod の dns モジュールはホストゾーンを新規作成しない**。既存ゾーンを `data "aws_route53_zone"` で参照し、レコード（CloudFront への A/AAAA、ACM 検証 CNAME、DKIM CNAME）のみ作成する。理由：新規作成すると NS が変わりレジストラ変更が必要になり、MX ごと止めるリスクが復活する。ゾーン自体は複数用途（サイト・メール受信）が依存する資源のため、§10 と同じ理屈で **Terraform 管理外**として扱う。
    3. **カットオーバーは A案で確定**（下記ステップ3）。新旧ディストリビューションが同一アカウントにあるため、apex を含めてサポート依頼なしで移動できる。
- **ステップ1：dev 構築** — リポ作成 → state バケット → cicd（初回のみ手元 apply）→ dns（`dev.aibee-lab.jp` のゾーンを dev アカウントに新設）→ hosting → contact。noindex＋Basic 認証。フォーム通し確認（SW・レート制限含む）。
  - **NS 委譲は手作業（クロスアカウントのため）**：dev で作られたゾーンの NS 4本を、**prod アカウントの現行ゾーンに `dev.aibee-lab.jp` の NS レコードとして手で追加する**。dev 環境の Terraform は dev アカウントの権限しか持たず、prod のゾーンに書けないため。レジストラのネームサーバー設定は触らない。稼働中の www・MX には影響しない。
  - ※この時点で dev.just47.jp フッター「運営」リンクの 404 が解消する。
- **ステップ2：prod 構築（旧サイト稼働のまま）** — **Terraform 管理外の共有資源を先に作成**（OIDC プロバイダ／`admin@aibee-lab.jp` identity の作成と verify クリック。コマンドは §10）→ ACM（www＋apex、us-east-1）を**事前発行**（検証 CNAME は既存ゾーンに足すだけで旧サイトに影響しない）→ エイリアス無しで一式 apply → 既定ドメイン（*.cloudfront.net）で最終確認。SES 送信用ドメイン identity（aibee-lab.jp・ap-northeast-1）の DKIM CNAME も先行投入可。
  - **ゾーンは新規作成しない**（ステップ0の結論2）。prod の dns モジュールは既存ゾーンを `data "aws_route53_zone"` で参照し、レコードのみ作成する。**MX には触れない。**
- **ステップ3：カットオーバー（A案で確定）** — 新旧とも prod アカウントにあるため、同一アカウント移動が使える。
  1. 事前に対象レコード（www・apex の A/AAAA）の TTL を短縮しておく（60秒程度）。
  2. **`aws cloudfront update-domain-association`**（旧 `associate-alias` 相当）で www と apex を新ディストリビューションへ移動する。同一アカウント移動は **apex を含めて**サポート依頼なしで実行でき、「外す→付ける」の2操作で生じるダウンタイムを避けられる。ターゲット側に当該ドメインを含む ACM 証明書が付いていることが前提（ステップ2で満たす）。
  3. Route53 の A/AAAA を新 CloudFront へ向ける。残る切替の窓は DNS の TTL 分のみ。
  4. www・apex（→ www へ 301）・/contact の送信まで通しで確認する。
  - B案（旧から外す → 新に付ける → DNS 変更）は、上記が使えない場合のフォールバックとして残す（該当 Host が数分〜十数分 403 になる）。
- **ステップ4：後始末** — 旧リソース（旧 CloudFront・旧 S3・旧フォームのバックエンド）を撤去。**SES サンドボックス解除申請（prod）を即時提出**（§5）。**ゾーンの移管・レジストラのネームサーバー変更は行わない**（ステップ0の結論1）。

## 10. 共有アカウント資源の方針と台帳

文書の依存は §0 で断ったが、**共有 AWS アカウント上の資源**という現実の依存は残る。ここに集約する（本書で唯一、just47 リポジトリとの調整が必要な節）。

**原則（決定）：複数プロジェクトが依存するアカウントレベルの資源は、どのプロジェクトの Terraform state にも入れない。** state バケットと同じ「Terraform 管理外」とし、作成コマンドを両リポの仕様書に記載、必要な場合のみ data source で参照する。理由：

1. 所有リポの `terraform destroy`・再構築が他リポの CI や運用を壊す構造を排除する（プロバイダをどちらかが所有すると、そのリポの破棄でもう片方の CI 認証が死ぬ）。
2. 「先に構築した方が所有」という偶然による非対称を排除する（dev は just47、prod は本リポ、という状態を作らない）。
3. state の移動（import）が不要で、移行作業が最小になる。
4. 既存の state バケット運用（Terraform 管理外・スクリプト作成）と同じ枠組みで、覚えるルールが増えない。

| 共有資源 | dev アカウント | prod アカウント | 参照方法 |
|---|---|---|---|
| GitHub Actions 用 OIDC プロバイダ | 作成済み（just47 構築時。state からは外す→下記反映事項） | **prod 構築前に CLI で作成** | 両リポとも `data "aws_iam_openid_connect_provider"`（URL 指定） |
| SES email identity `admin@aibee-lab.jp` | 作成・verify 済み（同上） | **prod 構築時に CLI で作成し、verify リンクを手動クリック** | 参照不要（宛先アドレスは tfvars 由来の文字列で足りる） |
| SES サンドボックス状態 | 解除しない | **本リポ側で解除申請**（www.aibee-lab.jp 公開後すぐ） | —（アカウント属性。解除1回で just47 分もカバー） |
| Terraform state バケット | プロジェクトごとに別（共有しない） | 同左 | — |

**作成コマンド（Terraform 管理外・アカウントごとに1回）**

```
# OIDC プロバイダ（thumbprint は指定不要。AWS が自動取得する。古い CLI で要求されたら CLI を更新）
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com

# 運営通知先の email identity（作成後、届く確認メールのリンクを手動クリック）
aws sesv2 create-email-identity --email-identity admin@aibee-lab.jp
```

管理外のため Terraform の default_tags は付かない（許容する）。

**just47 側の仕様書・コードへ反映が必要な事項**（該当作業の時点で）：

1. **OIDC プロバイダと `admin@aibee-lab.jp` identity を Terraform 管理から外す**：リソース定義を削除し、プロバイダはロールの信頼ポリシーから `data` 参照に切り替える。state からの除外は **`removed` ブロック＋ `lifecycle { destroy = false }`**（Terraform 1.7+）で行えば、通常の CI 経路（plan 確認 → apply）のまま完結し、手元で state を操作せずに済む。AWS 上の資源はそのまま残るため CI は止まらない。
2. SES サンドボックス解除は aibee-lab 側の申請で前倒し完了（予定）。just47 §12 の「just47.jp が立ってから申請」という順序依存の記述を更新する。
3. dev フッター「運営」リンク（dev.aibee-lab.jp）の 404 が解消した旨。
4. 「共有資源は Terraform 管理外」の原則と上記の作成コマンドを just47 仕様書にも記載する（両リポが自己完結で運用できるようにするため）。

## 11. 残タスク

0. ~~現状把握（§9 ステップ0）~~ …**完了（2026-08-30）**。結果と結論は §9 ステップ0 に記録
1. ~~リポジトリ作成（`alp007-aibee-lab`）~~ …**完了（2026-08-30。develop ブランチに初期構成〈仕様書・CLAUDE.md・ロゴ・.gitignore・.nvmrc・.env.example〉を push 済み）**。以降：リファレンス配置（§0）、state バケット作成、**初回セットアップ時に npm audit を棚卸しし本書へ記録、OIDC subject の実書式を確認**（§7 の immutable claims）。dev 構築と前後して just47 側の共有資源の state 除外（§10 反映事項1）を実施
2. Claude Design でデザイン作成（ブリーフ＝`SITE_DESIGN_BRIEF.md` 第1版。IA・確定文言・ビジュアル方向を統合済み。SITEMAP.md／文言ドラフトは役目を終え削除可）
3. dev 構築（§9 ステップ1）と実装（Claude Code）、dev で通し確認
4. prod 構築（ステップ2）→ カットオーバー（ステップ3）→ 後始末・SES 申請（ステップ4）
5. §10 の just47 仕様書反映

## 12. 未決事項

- なし（§9 ステップ0の完了により、prod のゾーン戦略＝現行ゾーン継続・data 参照、カットオーバー＝A案、で確定）。

## 改訂履歴

| 日付 | 版 | 内容 |
|---|---|---|
| 2026-08-17 | 初版 | 検討結果を集約して起票：役割（運営元プロフィール／受注サイトにしない）、主語と語彙の規約、ヒーロー案1確定、沿革2021年起点、ページ構成、フォーム設置の決定、GA4 不採用、AWS アカウント共通・リポジトリ別・モジュール共有なし、SES identity 所有権、カットオーバー2案。just47 仕様書準拠部は参照方式（差分駆動）で記述 |
| 2026-08-17 | 第2版 | **自己完結方式へ全面改訂**：差分駆動（「just47 §n 準拠」参照）を廃止。理由は (1) Claude Code が実装時に他リポの文書を読めず参照が規範として機能しない、(2) just47 側の改訂のたびに参照の生死を確認する運用が成立しない、(3) 両サイトは fork 後それぞれ独立に進化するため、仕様書の所有単位はコードの所有単位（モジュールをコピーして独立管理）と揃えるべき。just47 由来の実装知見のうち本サイトに効くものを結論＋理由ごと本文へ取り込み（§2 環境変数管理・§5 フォーム一式・§7 インフラ・§8 CI/CD）、出自注記は参照義務のない情報提供に格下げ。リポ間依存を「共有 AWS リソースの所有権」に限定し §10 を台帳化。**訂正**：OIDC プロバイダは「dev/prod とも just47 作成済み」ではなく、just47 の prod が未構築のため **prod は本リポが作成・所有**する（admin@ identity と同じ構図）。**追加**：本リポは 2026-07-15 以降の新規作成のため immutable subject claims（ID 入り subject）に該当する見込み——初回に実書式を確認してから信頼ポリシーを書く注意を §7 に記載 |
| 2026-08-17 | 第3版 | **共有アカウント資源の方針を確定**（§10 を「共有アカウント資源の方針と台帳」に改題・原則新設）：複数プロジェクトが依存するアカウントレベル資源（OIDC プロバイダ・`admin@aibee-lab.jp` identity）は**どのリポの Terraform state にも入れず管理外とする**（state バケット方式）。理由は (1) 所有リポの destroy が他リポの CI を壊す構造の排除、(2)「先に作った方が所有」という偶然の非対称の排除、(3) state 移動（import）不要で移行最小、(4) 既存の state バケット運用と同一枠組み。第2版の「prod のプロバイダと admin@ は本リポが所有」を撤回。作成コマンドを §10 に記載し、just47 側の外し方（`removed` ブロック＋ `destroy = false` で CI 経路のまま state 除外）を反映事項に明記。§0・§5・§7・§9・§11 を追随。**確定事項の反映**：屋号の正式表記＝アイビーラボ（英語表記 Aibee Lab は補助）、リポジトリ名＝ `alp007-aibee-lab`（ヒーロー文言・主語規約・OIDC sub 例・state バケット名・残タスクに反映し §12 から削除） |
| 2026-08-17 | 第4版 | **参照実装の方針を追加**（§0）：just47 コードのスナップショットを `.reference/just47/`（gitignore 対象）に置き、Claude Code の参照・流用元とする。仕様書＝規範／リファレンス＝非規範（食い違いは仕様書が正）。`git archive` による取得と SNAPSHOT.txt での出自記録、tsconfig・ESLint からの除外、実装完了後は削除可。fork 方式・git submodule・マルチルート起動は理由を付して不採用。CLAUDE.md に流用ルールと差し替え必須の差分（GA4 等の持ち込み禁止、`PORTAL_URL` の向き、リソース命名、OIDC sub、フォーム文言、デザイン）を追記。§11 に配置タスクを追加 |
| 2026-08-17 | 第5版 | サイトマップ（IA）作成に伴う追記（§2）：robots.txt / sitemap.xml を Metadata Routes（`app/robots.ts`・`app/sitemap.ts`）で生成（対象は3ページ。dev の非索引は配信層の X-Robots-Tag が担うため環境分岐なし）。**地図埋め込みは行わない決定**（外部スクリプト・Cookie が発生し Cookie 不使用の宣言と両立しないため。所在地はテキスト記載）。ページ・セクションの詳細構成は SITEMAP.md（ブリーフ統合までの中間文書）として起票 |
| 2026-08-17 | 第6版 | 確定事項の反映：**ヘッダーナビは英語表記4項目（Services / Works / About Us / Contact）で確定**。「会社概要」を使わない語に追加（「会社」が法人格を連想させるため。§1 の語彙規約・§2 のページ表を更新、ページ上の見出しでも不使用）。**所在地確定**（〒221-0052 横浜クリエーションスクエア14階・建物名まで記載）。**連絡手段はフォームに一本化**——電話番号・メールアドレスはサイトに掲載しない（§1 に追加。必要な場面では admin@aibee-lab.jp）。詳細構成は SITEMAP.md に反映（フッターラベルは日本語のままの提案を追記） |
| 2026-08-17 | 第7版 | 文言ドラフト第1稿のレビューを反映：**「運営の姿勢」セクションを削除**（方針文として弱く、弱い約束の羅列は逆効果。アプリに関する約束の置き場はアプリ・ストア側が正。データ設計の1文のみ事業内容の自社アプリ項へ移植可。見直す合図：課金導入時に支払い前の安心材料が不足すると判断したら、その時点の事実で再設計）。トップ構成は Hero → 事業内容 → 実績 → 沿革 → アイビーラボ（About Us）の5節に（§2）。**実績の資格表記を廃止**。**代表名は記載しない**（§1 の決定を変更。App Store 販売者表記との突合は不成立となる代償を記録）。**フォームのカテゴリ選択を廃止**（§5 の保存項目・運営通知・確認メール控え・フォーム項目を更新、§12 から削除）。About の日本語見出しは「アイビーラボ」 |
| 2026-08-17 | 第8版 | 文言ドラフト第2稿の確認事項1〜4を確定：privacy 制定日＝公開日、© 表記＝© Aibee Lab（年なし）、フッターラベル＝日本語のまま、差出人表示名＝「アイビーラボ お問い合わせ窓口」（§5 に反映、§12 から削除）。自社アプリ項の移植文の要否のみ確認中（§12） |
| 2026-08-17 | 第9版 | 文言確定の完了：自社アプリ項の移植文を削除（「運営の姿勢」由来の記述はセクションごと完全削除で確定）。**`SITE_DESIGN_BRIEF.md` 第1版を作成**し、SITEMAP.md（IA）と文言ドラフトを統合——以後、構成・文言の正はブリーフ（両中間文書は統合済みマーク付きで役目終了）。ブリーフにビジュアル方向を起票：just47 中立アイデンティティと家族的類似（暖オフホワイト地・明朝見出しを共有）、差し色は別 hue の1色（ネイビー系候補・最終は Design）、モチーフなし、表の組版重視、モバイルファースト、ダークモード初版非対応。§11・§12 を更新 |
| 2026-08-30 | 第10版 | 英字表記の正を **AiBee Lab** に変更（既存ロゴの表記に準拠。§1・冒頭を更新。© 表記など画面上の表記はブリーフ第2版で反映）。ロゴは新規作成ではなく**既存 SVG ロゴを活用する方針に変更**——詳細（サイトのヘッダーは単色インク版／favicon・OG は原色パネル版）はブリーフ §0・§7 が正 |
| 2026-08-30 | 第11版 | **現状把握（§9 ステップ0）完了と、それに伴う移行設計の確定**：現行資産はすべて prod アカウント（Route53・CloudFront・S3・旧フォーム）、レジストラはバリュードメイン、メールは **AWS WorkMail**（MX＝`inbound-smtp.us-west-2`。SPF/DKIM/DMARC 無し。本プロジェクトでは一切触らない）。決定3点：(1) **ゾーン移管は不要・レジストラのネームサーバーは触らない**（メール断リスクを移行から排除）、(2) **prod の dns モジュールはゾーンを新規作成せず `data` 参照**しレコードのみ作成（dev は新規作成＋prod ゾーンへ NS 4本を手動登録して委譲。§7 に明記）、(3) **カットオーバーは A案で確定**——新旧が同一アカウントのため `update-domain-association` で apex を含めサポート依頼なしに移動でき、TTL 短縮＋DNS 差し替えで窓は TTL 分のみ（B案はフォールバックとして保持）。§11 のステップ0を完了、§12 を「未決なし」に更新 |
| 2026-08-30 | 第12版 | **リポジトリ名を実物に合わせて訂正**：`alp0007-aibee-lab` → **`alp007-aibee-lab`**（0が3つ。just47 の `alp006` に続く連番）。OIDC subject（`repo:aibee-lab-jp/alp007-aibee-lab:environment:dev`）・state バケット名（`alp007-aibee-lab-tfstate-<env>-<account_id>`）・リソース命名 prefix・§11 に反映。CLAUDE.md も追随。§11 のリポジトリ作成タスクを完了に更新（develop ブランチへ初期構成を push 済み） |
