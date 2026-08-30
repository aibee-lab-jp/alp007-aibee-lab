#!/usr/bin/env bash
set -euo pipefail

# 使い方: ./create-state-bucket.sh <dev|prod>
# 実行前に、対象環境(dev/prod)のAWSアカウントの認証情報でCLIが叩ける状態にしておくこと。

REGION="ap-northeast-1"

# --- 引数チェック: 環境名は dev か prod のみ ---
ENV="${1:-}"
if [[ "${ENV}" != "dev" && "${ENV}" != "prod" ]]; then
  echo "Usage: $0 <dev|prod>" >&2
  exit 1
fi

# --- 実際に叩いているアカウントIDを取得(取り違え検知のため引数にしない) ---
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
BUCKET="alp007-aibee-lab-tfstate-${ENV}-${ACCOUNT_ID}"

echo "Target environment : ${ENV}"
echo "Caller account ID  : ${ACCOUNT_ID}"
echo "State bucket       : ${BUCKET}"
echo "Region             : ${REGION}"
echo

# --- バケット作成(ap-northeast-1 は LocationConstraint 必須) ---
# 既に存在する場合はスキップし、後続の各設定は常に当てる(全て冪等のため再実行安全)。
if aws s3api head-bucket --bucket "${BUCKET}" 2>/dev/null; then
  echo "Bucket already exists: ${BUCKET} — skipping creation, ensuring settings."
else
  aws s3api create-bucket \
    --bucket "${BUCKET}" \
    --region "${REGION}" \
    --create-bucket-configuration LocationConstraint="${REGION}"
  echo "Bucket created: ${BUCKET}"
fi

# --- state保護: バージョニング(誤上書き・破損からの復旧用) ---
aws s3api put-bucket-versioning \
  --bucket "${BUCKET}" \
  --versioning-configuration Status=Enabled

# --- 暗号化(SSE-S3) ---
aws s3api put-bucket-encryption \
  --bucket "${BUCKET}" \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"},"BucketKeyEnabled":true}]}'

# --- パブリックアクセス全ブロック ---
aws s3api put-public-access-block \
  --bucket "${BUCKET}" \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo
echo "State bucket ready: ${BUCKET} in ${REGION} (account ${ACCOUNT_ID})"
