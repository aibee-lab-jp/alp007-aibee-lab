# dev 環境の配線。リソース本体は modules/ 側。ここは薄い入口。
# この段階では cicd のみ。hosting / contact / dns は後続で足す（§9 ステップ1の順序）。

# CI/CD：GitHub Actions が assume する IAM ロール（§7・§8）。
# OIDC プロバイダはアカウント共有資源のため作らず、モジュール側で data 参照する（§10）。
# 信頼ポリシーの sub は environment ベース（repo:<owner/repo>:environment:dev）。ジョブが
# environment: dev を参照すると sub がブランチではなく environment ベースになるため。
# ブランチ制限（develop のみ）は GitHub の dev Environment の Deployment branches が担う
# （詳細は modules/cicd/main.tf の信頼ポリシーのコメント参照）。
module "cicd" {
  source = "../../modules/cicd"

  name_prefix = var.name_prefix
  environment = var.environment # sub の environment 名（GitHub Environment 名 "dev" と一致させる）

  # dev/prod で変わらない値なので tfvars ではなくここに置く（tfvars が持つのは環境差だけ。§7）。
  github_repository = "aibee-lab-jp/alp007-aibee-lab"
}
