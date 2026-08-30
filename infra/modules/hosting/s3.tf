# 静的アセット用 S3 バケット。
# - 非公開（パブリックアクセス全ブロック）。
# - CloudFront からは OAC（Origin Access Control）経由でのみ読める（バケットポリシーで許可）。
# - 中身（_assets / _cache）は Terraform では管理せず、apply 後に `aws s3 sync` で投入する（§7・§8）。

resource "aws_s3_bucket" "assets" {
  bucket        = "${var.name_prefix}-assets"
  force_destroy = true # dev 想定。オブジェクトごと破棄可能にしておく。
}

# 所有者を明示（ACL 無効化＝バケット所有者強制）。
resource "aws_s3_bucket_ownership_controls" "assets" {
  bucket = aws_s3_bucket.assets.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# パブリックアクセスは全面ブロック（配信は CloudFront + OAC のみ）。
resource "aws_s3_bucket_public_access_block" "assets" {
  bucket                  = aws_s3_bucket.assets.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront → S3 の OAC（sigv4 で常時署名）。
resource "aws_cloudfront_origin_access_control" "s3" {
  name                              = "${var.name_prefix}-s3-oac"
  description                       = "OAC for ${var.name_prefix} assets bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# このディストリビューションの OAC だけに GetObject を許可するバケットポリシー。
data "aws_iam_policy_document" "assets" {
  statement {
    sid       = "AllowCloudFrontOACRead"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.assets.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.this.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "assets" {
  bucket = aws_s3_bucket.assets.id
  policy = data.aws_iam_policy_document.assets.json

  # パブリックアクセスブロック確定後に付与。
  depends_on = [aws_s3_bucket_public_access_block.assets]
}
