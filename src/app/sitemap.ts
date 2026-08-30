import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

// sitemap.xml（Metadata Route・§2）。対象は /・/contact・/privacy の3件。
// URL は NEXT_PUBLIC_SITE_URL から組み立てる（ハードコードしない）。
// lastModified は持たない（ビルドのたびに値が変わり、実際の更新を表さないため）。
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/contact", "/privacy"].map((path) => ({
    url: new URL(path, env.siteUrl).toString(),
  }));
}
