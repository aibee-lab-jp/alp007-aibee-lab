# Route53 パブリックホストゾーン（§7「ホストゾーンの扱いは dev と prod で異なる」）。
#
# - dev  … dev.aibee-lab.jp のゾーンを dev アカウントに**新規作成**する（Terraform 管理）。
#          作成後、NS 4本を prod アカウントの aibee-lab.jp ゾーンへ**手作業で1回**登録して
#          委譲する（Terraform はクロスアカウントに書けないため。§9 ステップ1）。
# - prod … aibee-lab.jp のゾーンは**既に prod アカウントに存在し、WorkMail の MX を含む**。
#          新規作成すると NS が変わり、レジストラ変更＝メール断のリスクを招くため
#          **絶対に作らない**。data で参照し、レコードのみ足す（§9 ステップ0 結論2・§10 と同じ理屈）。
#
# 作成／参照は var.create_zone で切り替える。既定値を置かない（未指定なら Terraform が止まる）：
# 既定 true にすると prod で指定を忘れたときに既存ゾーンの二重作成に進んでしまうため。
resource "aws_route53_zone" "this" {
  count = var.create_zone ? 1 : 0

  name    = var.zone_name
  comment = "aibee-lab ${var.environment} zone (${var.zone_name})"

  tags = {
    Name = var.zone_name
  }
}

# 既存ゾーンの参照（prod 用）。ゾーン自体は Terraform 管理外の資源として扱う。
data "aws_route53_zone" "existing" {
  count = var.create_zone ? 0 : 1

  name         = var.zone_name
  private_zone = false
}

# 以降（このモジュールの検証レコード、将来 hosting/contact が足すレコード）は
# すべてこの zone_id を使う＝作成／参照のどちらでも同じ書き方になる。
locals {
  zone_id      = var.create_zone ? aws_route53_zone.this[0].zone_id : data.aws_route53_zone.existing[0].zone_id
  name_servers = var.create_zone ? aws_route53_zone.this[0].name_servers : data.aws_route53_zone.existing[0].name_servers
}
