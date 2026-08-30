# 共通ローカル値。

locals {
  # OpenNext 出力の各パス（open-next.output.json の origins/behaviors に対応）。
  server_bundle = "${var.opennext_path}/server-functions/default"
  image_bundle  = "${var.opennext_path}/image-optimization-function"

  # 静的アセットの S3 上のレイアウト（open-next.output.json の origins.s3.copy に対応）。
  #   .open-next/assets → s3://bucket/_assets   （CloudFront が配信。originPath=_assets）
  #   .open-next/cache  → s3://bucket/_cache    （server Lambda が S3 直読み。CloudFront 非経由）
  assets_prefix = "_assets"
  cache_prefix  = "_cache"

  # server 関数の incremental cache（override=s3）はキーに BUILD_ID を含める。
  # 値は .open-next/assets/BUILD_ID（= .next のビルドID）。
  # ※ plan 時に読むため、**先に `npx open-next build` が済んでいる必要がある**（§8 の CI は
  #   plan の前にビルドする順序になっている）。ビルド前だと file() がこのパスを見つけられず plan が失敗する。
  build_id = trimspace(file("${var.opennext_path}/assets/BUILD_ID"))

  # エイリアス（独自ドメイン）の適用有無。
  # prod の初回 apply は false で行う：同一ドメイン名は同時に1ディストリビューションにしか付けられず
  # （CNAMEAlreadyExists）、旧サイト稼働中はエイリアス付き apply が失敗するため。既定ドメイン
  # （*.cloudfront.net）で確認まで済ませ、カットオーバー時に true にする（§7・§9 ステップ2〜3）。
  aliases = var.alias_enabled ? [var.site_domain] : []
}
