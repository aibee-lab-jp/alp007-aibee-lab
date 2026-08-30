# hosting モジュールの出力。

output "cloudfront_domain_name" {
  description = "配信 URL（確認用）。https://<この値>/ でアクセスする。"
  value       = aws_cloudfront_distribution.this.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront ディストリビューション ID（invalidation 等に使用）。"
  value       = aws_cloudfront_distribution.this.id
}

output "assets_bucket_name" {
  description = "静的アセット用 S3 バケット名（aws s3 sync の宛先）。"
  value       = aws_s3_bucket.assets.id
}

output "server_function_name" {
  description = "server(SSR) Lambda 関数名。"
  value       = aws_lambda_function.server.function_name
}

output "image_function_name" {
  description = "image 最適化 Lambda 関数名。"
  value       = aws_lambda_function.image.function_name
}

# contact モジュールが server ロールに権限（DynamoDB/SES）を追加するために参照する。
output "server_role_name" {
  description = "server(SSR) Lambda 実行ロール名。contact モジュールが aws_iam_role_policy で権限を足す。"
  value       = aws_iam_role.server.name
}

output "server_role_arn" {
  description = "server(SSR) Lambda 実行ロール ARN。"
  value       = aws_iam_role.server.arn
}

# apply 後にアセットを投入するコマンド（§7・§8 の「S3 同期」導線）。
# CI（deploy-dev-apply）の sync ステップはこの2行と同じ内容を実行する。
output "asset_sync_commands" {
  description = "apply 後に .open-next/ の中身を S3 へ投入するための sync コマンド。"
  value       = <<-EOT
    aws s3 sync .open-next/assets s3://${aws_s3_bucket.assets.id}/${local.assets_prefix} --delete
    aws s3 sync .open-next/cache  s3://${aws_s3_bucket.assets.id}/${local.cache_prefix}  --delete
  EOT
}
