# dev 環境の出力（この段では cicd のみ）。

output "cicd_role_arn" {
  description = <<-EOT
    GitHub Actions が assume する IAM ロールの ARN。
    GitHub の dev Environment の Variables に AWS_ROLE_ARN として設定する（§2・§8）。
  EOT
  value       = module.cicd.role_arn
}

output "cicd_oidc_provider_arn" {
  description = "信頼ポリシーが参照している OIDC プロバイダの ARN（Terraform 管理外の共有資源。§10）。"
  value       = module.cicd.oidc_provider_arn
}

output "cicd_role_trust_subject" {
  description = <<-EOT
    信頼ポリシーが許可する OIDC の sub。GitHub Actions 側が送ってくる実値と突き合わせて
    認証失敗を切り分けるための確認用（§7 の immutable subject claims の確認にも使う）。
  EOT
  value       = module.cicd.role_trust_subject
}

# --- DNS ---
output "dns_zone_id" {
  description = "dev.aibee-lab.jp の Route53 ホストゾーン ID。"
  value       = module.dns.zone_id
}

output "dns_name_servers" {
  description = <<-EOT
    apply 後、**prod アカウントの aibee-lab.jp ゾーンに `dev.aibee-lab.jp` の NS レコードとして
    手作業で登録する4本**（クロスアカウントのため Terraform では書けない。§9 ステップ1）。
    レジストラのネームサーバー設定は触らない。
  EOT
  value       = module.dns.name_servers
}

output "acm_certificate_arn" {
  description = "CloudFront 用 ACM 証明書 ARN（us-east-1・検証済み）。hosting 追加時に viewer_certificate へ渡す。"
  value       = module.dns.certificate_arn
}

# --- アプリのビルド時設定（NEXT_PUBLIC_*）。§2：CI がビルド前に terraform output -raw で取得する ---
# 命名は app_<環境変数のスネークケース>。GitHub Variables には登録しない（GitHub は AWS_ROLE_ARN のみ）。
output "app_site_url" {
  description = <<-EOT
    NEXT_PUBLIC_SITE_URL。site_domain から組み立てる（値を二重に持たない）。
    **末尾スラッシュを付けない**：serverActions.allowedOrigins（new URL().host）と metadataBase の
    基準として使うため。
  EOT
  value       = "https://${var.site_domain}"
}

output "app_portal_url" {
  description = "NEXT_PUBLIC_PORTAL_URL（「とりあえず47」への導線）。"
  value       = var.portal_url
}

output "app_env" {
  description = "NEXT_PUBLIC_ENV。既存の environment 変数をそのまま使う（dev/prod）。"
  value       = var.environment
}

# --- 配信（hosting） ---
output "cloudfront_domain_name" {
  description = "配信 URL（確認用）。https://<この値>/"
  value       = module.hosting.cloudfront_domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront ディストリビューション ID（CI の invalidation が terraform output -raw で取得する）。"
  value       = module.hosting.cloudfront_distribution_id
}

output "assets_bucket_name" {
  description = "静的アセット用 S3 バケット名（CI の aws s3 sync が terraform output -raw で取得する）。"
  value       = module.hosting.assets_bucket_name
}

output "server_function_name" {
  description = "server(SSR) Lambda 関数名。"
  value       = module.hosting.server_function_name
}

output "image_function_name" {
  description = "image 最適化 Lambda 関数名。"
  value       = module.hosting.image_function_name
}

output "asset_sync_commands" {
  description = "apply 後に .open-next/ を S3 へ投入するコマンド（CI が行う内容と同じ）。"
  value       = module.hosting.asset_sync_commands
}

output "site_url" {
  description = "独自ドメインでの配信 URL（人が開く用・末尾スラッシュ付き）。"
  value       = "https://${var.site_domain}/"
}

# --- 問い合わせフォーム（contact） ---
output "contact_table_name" {
  description = "問い合わせ保存用 DynamoDB テーブル名。"
  value       = module.contact.table_name
}

output "contact_rate_limit_table_name" {
  description = "送信レート制限用 DynamoDB テーブル名（§5）。"
  value       = module.contact.rate_limit_table_name
}

output "ses_domain_identity_arn" {
  description = "SES 送信ドメイン ID（dev.aibee-lab.jp）の ARN。"
  value       = module.contact.ses_domain_identity_arn
}

output "ses_domain_verified_for_sending" {
  description = "送信ドメインが DKIM 検証済みで送信可能か（apply 直後 false → DKIM 伝播後 true）。"
  value       = module.contact.ses_domain_verified_for_sending
}
