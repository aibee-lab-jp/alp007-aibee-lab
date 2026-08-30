# cicd モジュールの入力。

variable "name_prefix" {
  description = "リソース名の接頭辞（例 alp007-aibee-lab-dev）。ロール名・インラインポリシー名に使う。"
  type        = string
}

variable "environment" {
  description = <<-EOT
    環境名（dev/prod）。信頼ポリシーの sub 限定に使う
    （sub = repo:<owner/repo>:environment:<environment>。GitHub Environment 名と一致させること）。
  EOT
  type        = string
}

variable "github_repository" {
  description = <<-EOT
    GitHub リポジトリ（owner/repo 形式。本リポは aibee-lab-jp/alp007-aibee-lab）。
    信頼ポリシーの sub 限定に使う。モジュール側にハードコードせず環境ルートから渡す。
  EOT
  type        = string
}

# ブランチ制限用の変数は持たない。ジョブが environment を参照するため sub は environment ベースになり、
# ブランチ情報が sub に含まれないため（main.tf の信頼ポリシーのコメント参照）。ブランチ制限は
# GitHub Environments の Deployment branches が担う。
