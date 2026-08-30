import type { NextConfig } from "next";
import { env } from "./src/lib/env";

// Server Action の CSRF 対策（§5）：Next は Server Action リクエストの Origin を Host と照合し、
// 一致しないとブロックする。CloudFront 配信では Origin=配信ドメイン／Host=Lambda Function URL と
// なり不一致になるため、配信ドメインを allowedOrigins で許可する。
// allowedOrigins は「スキームを含まない host」を要求するため、NEXT_PUBLIC_SITE_URL（完全 URL）から
// URL.host を取り出して渡す（ハードコードせず env から導出＝dev/prod の分岐も持たない）。
// ※ *.cloudfront.net のワイルドカードは他人の CloudFront も通るため使わない（§5）。
const siteHost = new URL(env.siteUrl).host;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [siteHost],
    },
  },
};

export default nextConfig;
