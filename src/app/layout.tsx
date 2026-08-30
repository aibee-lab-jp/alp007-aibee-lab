import type { Metadata } from "next";
import { Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { SiteFooter } from "@/components/chrome/SiteFooter";
import { ServiceWorkerRegister } from "@/components/chrome/ServiceWorkerRegister";
import { env } from "@/lib/env";
import { meta, site } from "@/lib/site-content";

/* 見出し＝Noto Serif JP、本文＝Noto Sans JP（確定・§2／ブリーフ §2）。
   next/font でセルフホスト。CJK は巨大なので preload しない（display: swap）。
   CSS 変数として公開し、globals.css の @theme が font-serif / font-sans に接続する。 */
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
  preload: false,
});

const notoSerifJP = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-noto-serif-jp",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  // メタデータ中の相対 URL（og:image 等）を絶対 URL に解決する基準（§2）。未設定だと Next は
  // localhost にフォールバックし、SNS のクローラーが画像を取得できない。
  // 値は env（NEXT_PUBLIC_SITE_URL）から取る＝ハードコードせず dev/prod で自動的に切り替わる。
  metadataBase: new URL(env.siteUrl),
  // 各ページで title を完成形（「〜｜アイビーラボ」）で持つため template は使わない（ブリーフ §6）。
  // ページ側は pageMetadata()（src/lib/metadata.ts）で openGraph ごと上書きする
  // （Next のメタデータは top-level キー単位の浅いマージのため）。ここはその既定値。
  title: meta.home.title,
  description: meta.home.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "ja_JP",
    // 共通 OG 画像（全ページ共用・1200×630）。**現時点では未作成のプレースホルダ参照**（ブリーフ §7）。
    images: [site.ogImage],
  },
  // dev の非索引化は配信層の X-Robots-Tag が担うため、ここに環境分岐は持たない（§2・§7）。
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} ${notoSerifJP.variable}`}>
      <body className="flex min-h-screen flex-col">
        {/* Server Action(POST) 用に Service Worker を登録（UI なし。§5 の CloudFront OAC 対策）。 */}
        <ServiceWorkerRegister />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
