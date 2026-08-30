# cicd モジュールの出力。

output "role_arn" {
  description = "GitHub Actions が assume する IAM ロールの ARN。GitHub の Variables（AWS_ROLE_ARN）に設定する。"
  value       = aws_iam_role.github_actions.arn
}

output "role_name" {
  description = "同ロールの名前（コンソールや CLI での確認用）。"
  value       = aws_iam_role.github_actions.name
}

output "oidc_provider_arn" {
  description = "参照した GitHub Actions OIDC プロバイダの ARN（Terraform 管理外の共有資源。§10）。"
  value       = data.aws_iam_openid_connect_provider.github.arn
}

output "role_trust_subject" {
  description = "信頼ポリシーが許可する OIDC の sub。実際に届く sub との突き合わせ（認証失敗の切り分け）に使う。"
  value       = local.trust_subject
}
