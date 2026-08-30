# contact モジュールの入力。
# 循環依存回避：テーブル名は env root で確定した値を受け取る（同じ値を hosting の
# server_environment にも渡す）。server_role_name は hosting の output を受け取る（一方向依存。§7）。

variable "name_prefix" {
  description = "リソース名の接頭辞（例 alp007-aibee-lab-dev）。ポリシー名等に使う。"
  type        = string
}

variable "environment" {
  description = "環境名（dev/prod）。タグ・命名の補助。"
  type        = string
}

variable "table_name" {
  description = <<-EOT
    問い合わせ保存用 DynamoDB テーブル名。env root が name_prefix から組み立てて渡す
    （例 alp007-aibee-lab-dev-contacts）。同じ値が hosting の CONTACT_TABLE_NAME にも渡る。
  EOT
  type        = string
}

variable "rate_limit_table_name" {
  description = <<-EOT
    送信レート制限用 DynamoDB テーブル名（§5）。env root が name_prefix から組み立てて渡す
    （例 alp007-aibee-lab-dev-contact-rate-limit）。同じ値が hosting の
    CONTACT_RATE_LIMIT_TABLE_NAME にも渡る。
  EOT
  type        = string
}

variable "ses_domain" {
  description = <<-EOT
    SES で検証する送信ドメイン（dev では dev.aibee-lab.jp）。送信元 no-reply@<このドメイン> は
    このドメイン ID の検証で送信可能になる。DKIM CNAME もこのドメイン配下に作る。
  EOT
  type        = string
}

variable "route53_zone_id" {
  description = "DKIM CNAME を作成する Route53 ホストゾーン ID（dns モジュールの zone_id）。"
  type        = string
}

variable "server_role_name" {
  description = "権限（DynamoDB PutItem・Query / SES SendEmail）を追加する server Lambda 実行ロール名（hosting の output）。"
  type        = string
}

variable "dkim_ttl" {
  description = "DKIM CNAME レコードの TTL（秒）。"
  type        = number
  default     = 1800
}

# 通知先アドレス（admin@aibee-lab.jp）の変数は持たない。
# identity は §10 の共有資源で Terraform 管理外（作成も参照もしない）。アドレス文字列は
# env root から server Lambda の CONTACT_NOTIFY_ADDRESS として直接渡るため、このモジュールには不要。
