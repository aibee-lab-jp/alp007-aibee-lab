# AWS provider 設定（dev 環境ルート）。リソース本体は modules/ 側で定義する。

# 既定 provider：東京リージョン。プロジェクト共通タグを全リソースへ付与する。
# dev アカウントは just47（alp006）と同居するため、Project タグで持ち主を区別できるようにする。
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "alp007-aibee-lab"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# CloudFront 用 ACM 証明書は us-east-1 必須（§7）。証明書を作る dns モジュールは後続のため、
# この段ではエイリアス（us_east_1）の宣言のみ。
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "alp007-aibee-lab"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
