# dns モジュールの出力。

output "zone_id" {
  description = "Route53 ホストゾーン ID（作成 or 参照）。後段のレコード（SES DKIM・CloudFront）が参照する。"
  value       = local.zone_id
}

output "zone_name" {
  description = "ホストゾーンのドメイン名（確認用）。"
  value       = var.zone_name
}

output "name_servers" {
  description = <<-EOT
    ゾーンの NS（4本）。**dev ではこの4本を prod アカウントの aibee-lab.jp ゾーンへ
    `dev.aibee-lab.jp` の NS レコードとして手作業で登録する**（クロスアカウントのため Terraform では書けない。§9 ステップ1）。
    prod（data 参照）では既存ゾーンの NS がそのまま出るだけで、操作は不要。
  EOT
  value       = local.name_servers
}

output "certificate_arn" {
  description = <<-EOT
    検証済み ACM 証明書 ARN（us-east-1）。CloudFront の viewer_certificate に渡す。
    aws_acm_certificate_validation を参照＝発行完了後に値が確定する（未発行参照を防ぐ）。
  EOT
  value       = aws_acm_certificate_validation.cert.certificate_arn
}
