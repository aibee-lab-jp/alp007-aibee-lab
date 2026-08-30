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

# DNS：dev.aibee-lab.jp のホストゾーン（新規作成）＋ACM 証明書（us-east-1）＋DNS 検証（§7）。
# ACM は CloudFront 用に us-east-1 必須のため、既定 aws（Route53）に加えて us-east-1 エイリアスを渡す
# （モジュール側は configuration_aliases = [aws.us_east_1] で受ける）。
# この段階では CloudFront が無いため、ゾーンと証明書までで完結する（A/AAAA は hosting の担当。§7）。
module "dns" {
  source = "../../modules/dns"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  zone_name   = var.dns_zone_name
  create_zone = var.dns_create_zone

  certificate_domain_name               = var.site_domain
  certificate_subject_alternative_names = var.certificate_subject_alternative_names

  name_prefix = var.name_prefix
  environment = var.environment
}
