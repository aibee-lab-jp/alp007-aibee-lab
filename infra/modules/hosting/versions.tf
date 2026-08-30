# hosting モジュールが要求する provider。
# aws は環境ルートから既定 provider を継承（このモジュールは us-east-1 を使わない＝ACM は dns の担当）。
# archive は Lambda デプロイ用 zip を plan 時に生成するために使う。
terraform {
  required_version = ">= 1.15.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}
