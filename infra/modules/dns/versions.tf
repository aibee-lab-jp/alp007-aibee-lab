# dns モジュールが要求する provider。
# 既定 aws（環境ルート継承・ap-northeast-1）で Route53（グローバル）を扱う。
# ACM 証明書は CloudFront 用に us-east-1 必須のため、us-east-1 プロバイダを別名で受け取る。
# aliased provider をモジュールへ渡す標準手段＝required_providers の configuration_aliases に
# aws.us_east_1 を宣言し、呼び出し側で providers = { aws.us_east_1 = aws.us_east_1 } を渡す。
terraform {
  required_version = ">= 1.15.7"

  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 6.0"
      configuration_aliases = [aws.us_east_1]
    }
  }
}
