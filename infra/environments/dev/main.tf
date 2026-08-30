# dev 環境の配線。リソース本体は modules/ 側。ここは薄い入口。

# 循環依存回避の要：contact の値をここ（env root）で確定する（§7）。
# - テーブル名は name_prefix から組み立て（contact が「作る名前」／hosting が「env 値」として同じ値を受ける）。
# - SES 検証ドメインは送信元アドレスのドメイン部から導出（送信元と検証ドメインの不整合を防ぐ）。
# これで依存は env root → hosting / contact の一方向になり、hosting↔contact の循環が起きない。
locals {
  contact_table_name = "${var.name_prefix}-contacts"
  # 送信レート制限用テーブル（§5）。問い合わせ保存用とは別テーブル（プライバシー＋TTL）。
  contact_rate_limit_table_name = "${var.name_prefix}-contact-rate-limit"
  ses_domain                    = split("@", var.ses_sender_address)[1] # no-reply@dev.aibee-lab.jp → dev.aibee-lab.jp

  # server Lambda に注入する env（§5 の Server Action が読む）。
  server_contact_env = {
    CONTACT_TABLE_NAME            = local.contact_table_name
    CONTACT_RATE_LIMIT_TABLE_NAME = local.contact_rate_limit_table_name
    # IP ハッシュ用ソルト（rate-limit-salt.tf で生成・§5）。リポジトリにも tfvars にも書かない。
    CONTACT_RATE_LIMIT_SALT = random_password.rate_limit_salt.result
    SES_SENDER_ADDRESS      = var.ses_sender_address
    CONTACT_NOTIFY_ADDRESS  = var.contact_notify_address
  }
}

# 配信基盤：S3＋CloudFront＋server/image Lambda（§7）。
module "hosting" {
  source = "../../modules/hosting"

  name_prefix = var.name_prefix
  environment = var.environment
  aws_region  = var.aws_region

  # OpenNext 出力（.open-next）は terraform 実行ディレクトリ（この環境ルート）からの相対。
  # infra/environments/dev → リポジトリ直下は 3 つ上。
  # ※ plan の前に `npx open-next build` が済んでいる必要がある（CI はその順序。§8）。
  opennext_path = "../../../.open-next"

  # contact の env を server Lambda に注入（値は上の locals で確定＝contact リソース非参照）。
  server_environment = local.server_contact_env

  # 独自ドメイン適用：dns の出力（証明書 ARN・zone_id）を受け取り CloudFront/エイリアスに使う。
  # hosting は dns を直接参照せず env 経由で受ける＝一方向（循環回避）。
  site_domain         = var.site_domain
  acm_certificate_arn = module.dns.certificate_arn
  route53_zone_id     = module.dns.zone_id
  alias_enabled       = var.alias_enabled
  noindex_enabled     = var.noindex_enabled

  # Basic 認証（dev のみ・CloudFront Function）。値は tfvars（§7 の明示的な例外）。
  basic_auth_enabled  = var.basic_auth_enabled
  basic_auth_username = var.basic_auth_username
  basic_auth_password = var.basic_auth_password
}

# 問い合わせフォーム：DynamoDB 2テーブル＋SES（送信ドメイン検証）＋server ロールへの権限追加（§5）。
module "contact" {
  source = "../../modules/contact"

  name_prefix = var.name_prefix
  environment = var.environment

  table_name            = local.contact_table_name
  rate_limit_table_name = local.contact_rate_limit_table_name
  ses_domain            = local.ses_domain

  # dns の zone_id に DKIM CNAME を作る。hosting の server ロールに権限を足す（ロールは二重に作らない）。
  route53_zone_id  = module.dns.zone_id
  server_role_name = module.hosting.server_role_name
}

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
  github_repository = "aibee-lab-jp@198689698/alp007-aibee-lab@1337691730"
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
