# dev 環境の state 保管先（S3 backend の接続値）。
# `terraform init -backend-config=backend.hcl` で渡す（versions.tf の backend "s3" は接続値を持たない）。
# dev/prod は別 AWS アカウントのため、この bucket は dev アカウント固有。
# バケット自体は Terraform 管理外（infra/scripts/create-state-bucket.sh で作成する。§7）。
# ※ use_lockfile（S3 ネイティブロック）は環境によらない固定設定のため versions.tf 側に置いてある。
bucket = "alp007-aibee-lab-tfstate-dev-127289506790"
key    = "dev/terraform.tfstate"
region = "ap-northeast-1"
