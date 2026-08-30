# Terraform / provider のバージョン制約と state backend（dev 環境ルート）。
terraform {
  # 仕様書 §2 の採用バージョン（1.15.7）を下限にする。実行バージョンは CI 側で固定する
  # （§8：plan / apply の2本で揃える）。S3 ネイティブ lockfile（use_lockfile）は
  # Terraform 1.10+ の機能で、この下限に含まれる。
  required_version = ">= 1.15.7"

  required_providers {
    aws = {
      source = "hashicorp/aws"
      # 現行メジャーは 6。メジャーだけ固定し、マイナー/パッチは .terraform.lock.hcl で管理する。
      version = "~> 6.0"
    }
  }

  # state は S3 backend ＋ S3 ネイティブ lockfile（§7）。ロック用 DynamoDB は作らない
  # （DynamoDB ロックは非推奨・将来削除）。
  # 接続値（bucket/key/region）はコードに直書きせず、環境別 backend.hcl を
  # `terraform init -backend-config=backend.hcl` で渡す（partial configuration）。
  # use_lockfile は環境によらない固定設定なので、backend.hcl ではなくここに置く。
  backend "s3" {
    use_lockfile = true
  }
}
