import type { Metadata } from "next";
import { site } from "@/lib/site-content";

// ページごとのメタデータを組み立てる（§2）。
//
// 【なぜヘルパーにするか】Next のメタデータは **top-level キー単位の浅いマージ**で、ページが
// openGraph を持つとルートレイアウトの openGraph を丸ごと置き換える（og:image・og:type・
// og:site_name が消える）。各ページで共通項を書き写すと抜けに気づけないため、1箇所で組み立てる。
//
// canonical / og:url は metadataBase からの相対パスで渡す（metadataBase は相対 URL の解決基準を
// 与えるだけで canonical や og:url を自動生成しないため、ページごとの指定が要る・§2）。
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description?: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: "ja_JP",
      title,
      description,
      url: path,
      images: [site.ogImage],
    },
  };
}
