# dns モジュールの入力。

variable "zone_name" {
  description = <<-EOT
    ホストゾーンのドメイン名（dev: dev.aibee-lab.jp／prod: aibee-lab.jp）。
    create_zone = true なら新規作成、false なら data で参照する対象。
    証明書のドメイン（certificate_domain_name）とは別物：prod ではゾーン＝apex、証明書＝www が正。
  EOT
  type        = string
}

variable "create_zone" {
  description = <<-EOT
    ホストゾーンを新規作成するか（dev: true／prod: false）。§7「ホストゾーンの扱いは dev と prod で異なる」。
    **既定値は置かない**：prod で指定を忘れたときに既存ゾーン（WorkMail の MX を含む）の
    二重作成へ進むと、NS 変更＝メール断のリスクになるため、未指定なら Terraform を止める。
  EOT
  type        = bool
}

variable "certificate_domain_name" {
  description = <<-EOT
    ACM 証明書の主ドメイン（dev: dev.aibee-lab.jp／prod: www.aibee-lab.jp）。
    CloudFront 用のため us-east-1 に作る。
  EOT
  type        = string
}

variable "certificate_subject_alternative_names" {
  description = <<-EOT
    ACM 証明書の SAN（dev: []／prod: ["aibee-lab.jp"]）。
    prod は apex → www の 301 を CloudFront で受けるため apex も証明書に含める必要がある（§7）。
  EOT
  type        = list(string)
  default     = []
}

variable "name_prefix" {
  description = "命名・タグ用の接頭辞（任意）。既定 provider の default_tags に加えて使う。"
  type        = string
  default     = ""
}

variable "environment" {
  description = "環境名（任意・タグとゾーンの comment に使う）。default_tags でも付く。"
  type        = string
  default     = ""
}
