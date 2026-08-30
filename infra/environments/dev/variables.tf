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
