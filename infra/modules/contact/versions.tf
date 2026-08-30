# contact モジュールが要求する provider。aws は環境ルートの既定 provider を継承。
terraform {
  required_version = ">= 1.15.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}
