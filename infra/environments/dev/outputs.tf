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
