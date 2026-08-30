# この環境ルートが受け取る変数（この段では cicd に必要な最小限）。
# 環境差の実値は terraform.tfvars に置く（§7）。

variable "aws_region" {
  description = "既定リソースを作成する AWS リージョン（東京）。dev/prod 共通のため既定値を持つ。"
  type        = string
  default     = "ap-northeast-1"
}

variable "environment" {
  description = <<-EOT
    環境名（dev/prod）。default_tags と命名に使うほか、cicd の信頼ポリシーの sub 限定
    （repo:<owner/repo>:environment:<environment>）にも使う。GitHub Environment 名と一致させること。
    既定値は置かない：prod へコピーしたときに dev の値が黙って通るのを防ぐため（未設定なら Terraform が止まる）。
  EOT
  type        = string
}

variable "name_prefix" {
  description = <<-EOT
    リソース名の接頭辞（dev: alp007-aibee-lab-dev）。この環境の全リソースに付ける。
    dev アカウントには just47（alp006）の資源が同居するため、リポジトリ名系の接頭辞で衝突を避ける。
    既定値は置かない（environment と同じ理由）。
  EOT
  type        = string
}

# --- ドメイン / DNS ---
variable "site_domain" {
  description = <<-EOT
    このサイトのドメイン（dev: dev.aibee-lab.jp／prod: www.aibee-lab.jp）。
    ACM 証明書の主ドメインであり、NEXT_PUBLIC_SITE_URL の組み立て元でもある（§2：URL 文字列を二重に持たない）。
    後段では CloudFront の aliases・エイリアス A/AAAA にも使う。
  EOT
  type        = string
}

variable "dns_zone_name" {
  description = <<-EOT
    Route53 ホストゾーンのドメイン名（dev: dev.aibee-lab.jp／prod: aibee-lab.jp）。
    prod ではサイトのドメイン（www）とゾーン（apex）が異なるため site_domain とは別変数にしている。
  EOT
  type        = string
}

variable "dns_create_zone" {
  description = <<-EOT
    ホストゾーンを新規作成するか（dev: true／prod: false＝既存ゾーンを data 参照）。§7。
    既定値は置かない（prod での指定忘れ＝既存ゾーンの二重作成を防ぐため。詳細は modules/dns/variables.tf）。
  EOT
  type        = bool
}

variable "certificate_subject_alternative_names" {
  description = <<-EOT
    ACM 証明書の SAN（dev: なし／prod: ["aibee-lab.jp"]＝apex → www の 301 用）。§7・§9 ステップ2。
  EOT
  type        = list(string)
  default     = []
}

# --- アプリのビルド時設定（NEXT_PUBLIC_*）。§2「環境変数の管理場所」＝Terraform が唯一の情報源。 ---
# CI はビルド前に terraform output から取得して $GITHUB_ENV に流し込む（GitHub Variables には置かない）。
# ※ NEXT_PUBLIC_SITE_URL は site_domain から、NEXT_PUBLIC_ENV は environment から導出する
#   （同じ値を二重に持たないため、tfvars には書かない）。
variable "portal_url" {
  description = <<-EOT
    「とりあえず47」ポータルの URL（NEXT_PUBLIC_PORTAL_URL。dev: https://dev.just47.jp）。
    just47 側の NEXT_PUBLIC_OPERATOR_URL の鏡像で、向きが逆（§2）。dev は dev 同士で閉じる。
  EOT
  type        = string
}
