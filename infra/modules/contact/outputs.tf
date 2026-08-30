# contact モジュールの出力。

output "table_name" {
  description = "問い合わせ保存用 DynamoDB テーブル名。"
  value       = aws_dynamodb_table.contacts.name
}

output "table_arn" {
  description = "問い合わせ保存用 DynamoDB テーブル ARN。"
  value       = aws_dynamodb_table.contacts.arn
}

output "rate_limit_table_name" {
  description = "送信レート制限用 DynamoDB テーブル名（server Lambda に環境変数で渡す）。"
  value       = aws_dynamodb_table.rate_limit.name
}

output "rate_limit_table_arn" {
  description = "送信レート制限用 DynamoDB テーブル ARN。"
  value       = aws_dynamodb_table.rate_limit.arn
}

output "ses_domain_identity_arn" {
  description = "送信ドメイン ID（dev.aibee-lab.jp）の ARN。"
  value       = aws_sesv2_email_identity.domain.arn
}

output "ses_domain_verified_for_sending" {
  description = "送信ドメインが送信可能（DKIM 検証済み）か。apply 直後は false、DKIM 伝播後に true。"
  value       = aws_sesv2_email_identity.domain.verified_for_sending_status
}
