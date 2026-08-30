// サイトの公開環境変数（すべて NEXT_PUBLIC_）を型付きで一元管理する（§2）。
// 各所で process.env を直接参照せず、このモジュール経由で読む。
//
// これらは「ビルド時に値が埋め込まれる」変数（NEXT_PUBLIC_）。
// - 各変数は必ずリテラル名で個別参照する（process.env.NEXT_PUBLIC_XXX）。
//   動的な process.env[name] は Next.js の静的置換の対象外で、配信物では undefined になるため。
// - 値は環境ごとの「完成した URL」をそのまま渡す（コードで環境名と結合しない。
//   prod は www など規則が不揃いなため）。ローカルは .env.local（dev 値）、CI は terraform output。
// - 渡し忘れると undefined のまま配信され、リンク等が壊れるので、欠けていればビルドを失敗させる。
//   このモジュールは各ページから間接的に import され、next build の事前レンダリング時に評価される。
// - 検証ライブラリは追加せず標準の TypeScript で実装する（§2）。
//
// ※ 本サイトは GA4 を導入しないため、測定 ID の変数は存在しない（§2・§6）。

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `[env] 必須の環境変数 ${name} が設定されていません。ローカルは .env.local、CI は terraform output から設定してください。`,
    );
  }
  return value;
}

export const env = {
  // このサイト自身の URL（dev: https://dev.aibee-lab.jp）。末尾スラッシュなし。
  siteUrl: required("NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL),
  // 「とりあえず47」ポータルの URL（dev: https://dev.just47.jp）。dev は dev 同士で閉じる。
  portalUrl: required("NEXT_PUBLIC_PORTAL_URL", process.env.NEXT_PUBLIC_PORTAL_URL),
  // 環境名（dev / prod）。URL 生成には使わない（§2）。
  environment: required("NEXT_PUBLIC_ENV", process.env.NEXT_PUBLIC_ENV),
} as const;
