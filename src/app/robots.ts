import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

// robots.txt（Metadata Route・§2）。
// dev の非索引化は配信層の X-Robots-Tag（CloudFront のレスポンスヘッダーポリシー）が担うため、
// ここに環境分岐は持たない（§2・§7）。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
