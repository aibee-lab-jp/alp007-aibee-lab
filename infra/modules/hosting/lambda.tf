# server(SSR) / image 最適化 の 2 関数。
# warmer / revalidation は載せない（§7：デプロイするのは server と image の 2 関数のみ）。
#
# open-next.output.json 対応：
#   origins.default        → server 関数（handler=index.handler, bundle=.open-next/server-functions/default）
#   origins.imageOptimizer → image 関数 （handler=index.handler, bundle=.open-next/image-optimization-function）
# いずれも wrapper=aws-lambda / converter=aws-apigw-v2 / streaming=false ＝ Function URL(BUFFERED) で受ける。

# ---- zip 化（archive_file。plan 時に生成） --------------------------------
# 方式：外部ビルド zip ではなく Terraform の archive_file で .open-next/ の各バンドルを直接固める。
# バンドルはそれぞれ 19M / 31M（unzip）で、zip・unzip とも Lambda の直接アップロード上限
# （50MB zip / 250MB unzip）に十分収まるため S3 経由アップロードは不要。
data "archive_file" "server" {
  type        = "zip"
  source_dir  = local.server_bundle
  output_path = "${path.module}/.terraform-artifacts/server.zip"
}

data "archive_file" "image" {
  type        = "zip"
  source_dir  = local.image_bundle
  output_path = "${path.module}/.terraform-artifacts/image.zip"
}

# ---- IAM：Lambda 実行ロール --------------------------------------------
data "aws_iam_policy_document" "lambda_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# server：基本ログ権限 ＋ incremental cache（S3 _cache/*）read/write。
# ※ SES / DynamoDB（フォーム保存）権限はここでは付けない（contact モジュールの担当）。
# ※ tagCache/queue は dummy のため DynamoDB/SQS 権限は不要。
resource "aws_iam_role" "server" {
  name               = "${var.name_prefix}-server-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "server_basic" {
  role       = aws_iam_role.server.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "server_cache" {
  statement {
    sid       = "IncrementalCacheS3"
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.assets.arn}/${local.cache_prefix}/*"]
  }
}

resource "aws_iam_role_policy" "server_cache" {
  name   = "${var.name_prefix}-server-cache"
  role   = aws_iam_role.server.id
  policy = data.aws_iam_policy_document.server_cache.json
}

# image：基本ログ権限 ＋ 元画像取得（S3 _assets/* の read）。
resource "aws_iam_role" "image" {
  name               = "${var.name_prefix}-image-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "image_basic" {
  role       = aws_iam_role.image.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "image_read" {
  statement {
    sid       = "ReadOriginalImages"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.assets.arn}/${local.assets_prefix}/*"]
  }
}

resource "aws_iam_role_policy" "image_read" {
  name   = "${var.name_prefix}-image-read"
  role   = aws_iam_role.image.id
  policy = data.aws_iam_policy_document.image_read.json
}

# ---- ロググループ（保持日数を明示） ------------------------------------
resource "aws_cloudwatch_log_group" "server" {
  name              = "/aws/lambda/${var.name_prefix}-server"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_log_group" "image" {
  name              = "/aws/lambda/${var.name_prefix}-image"
  retention_in_days = var.log_retention_days
}

# ---- Lambda 関数 -------------------------------------------------------
resource "aws_lambda_function" "server" {
  function_name = "${var.name_prefix}-server"
  role          = aws_iam_role.server.arn
  handler       = "index.handler"
  runtime       = var.lambda_runtime
  architectures = ["arm64"] # server は純 JS。image と揃えて arm64（Graviton＝安価）。
  memory_size   = var.server_memory_mb
  timeout       = var.server_timeout_sec

  filename         = data.archive_file.server.output_path
  source_code_hash = data.archive_file.server.output_base64sha256

  environment {
    # OpenNext 実行用の固定 env に、env root から渡す server_environment（contact 由来の
    # CONTACT_TABLE_NAME / SES_SENDER_ADDRESS / CONTACT_NOTIFY_ADDRESS）を merge する。
    variables = merge({
      # incremental cache（override=s3）が読む先。open-next の s3.js が参照するキー名。
      CACHE_BUCKET_NAME       = aws_s3_bucket.assets.id
      CACHE_BUCKET_KEY_PREFIX = local.cache_prefix
      CACHE_BUCKET_REGION     = var.aws_region
      OPEN_NEXT_BUILD_ID      = local.build_id
      NODE_ENV                = "production"
    }, var.server_environment)
  }

  depends_on = [aws_cloudwatch_log_group.server]
}

resource "aws_lambda_function" "image" {
  function_name = "${var.name_prefix}-image"
  role          = aws_iam_role.image.arn
  handler       = "index.handler"
  runtime       = var.lambda_runtime
  # OpenNext は sharp を --arch=arm64 --os=linux で入れる（createImageOptimizationBundle の既定）。
  # そのため image 関数は arm64。※ローカル(macOS)ビルドの .open-next には darwin 版 sharp が入るため、
  # 実デプロイは Linux(CI) ビルドの .open-next を使うこと（linux-arm64 の sharp が入る）。
  architectures = ["arm64"]
  memory_size   = var.image_memory_mb
  timeout       = var.image_timeout_sec

  filename         = data.archive_file.image.output_path
  source_code_hash = data.archive_file.image.output_base64sha256

  environment {
    variables = {
      # image loader（override=s3）が元画像を読む先。s3.js が参照するキー名。
      # region は未指定でよい（s3 loader は Lambda の AWS_REGION を使う）。
      BUCKET_NAME       = aws_s3_bucket.assets.id
      BUCKET_KEY_PREFIX = local.assets_prefix
      NODE_ENV          = "production"
    }
  }

  depends_on = [aws_cloudwatch_log_group.image]
}

# ---- Function URL（CloudFront からの入口。IAM 認証＋OAC で保護） --------
resource "aws_lambda_function_url" "server" {
  function_name      = aws_lambda_function.server.function_name
  authorization_type = "AWS_IAM"
  invoke_mode        = "BUFFERED" # streaming=false
}

resource "aws_lambda_function_url" "image" {
  function_name      = aws_lambda_function.image.function_name
  authorization_type = "AWS_IAM"
  invoke_mode        = "BUFFERED"
}

# CloudFront（OAC/lambda）だけが Function URL を叩けるよう許可。
#
# 【重要】2025年10月以降に作成された Function URL は、InvokeFunctionUrl **と** InvokeFunction の
# 両方の許可が必要（Lambda 公式 "Control access to Lambda function URLs"：
# "Starting in October 2025, new function URLs will require both lambda:InvokeFunctionUrl and
#  lambda:InvokeFunction permissions." / "If a function's resource-based policy doesn't grant
#  lambda:invokeFunctionUrl and lambda:InvokeFunction permissions, users will get a 403 Forbidden"）。
# CloudFront OAC 公式手順（"Restrict access to an AWS Lambda function URL origin"）でも
# add-permission を 2 回（InvokeFunctionUrl / InvokeFunction）実行するよう指示されている。
# InvokeFunctionUrl だけだと Lambda は起動されず 403 AccessDeniedException を返す。
resource "aws_lambda_permission" "server_cf" {
  statement_id           = "AllowCloudFrontInvokeUrl"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.server.function_name
  principal              = "cloudfront.amazonaws.com"
  source_arn             = aws_cloudfront_distribution.this.arn
  function_url_auth_type = "AWS_IAM"
}

resource "aws_lambda_permission" "server_cf_invoke" {
  statement_id  = "AllowCloudFrontInvokeFunction"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.server.function_name
  principal     = "cloudfront.amazonaws.com"
  source_arn    = aws_cloudfront_distribution.this.arn
}

resource "aws_lambda_permission" "image_cf" {
  statement_id           = "AllowCloudFrontInvokeUrl"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.image.function_name
  principal              = "cloudfront.amazonaws.com"
  source_arn             = aws_cloudfront_distribution.this.arn
  function_url_auth_type = "AWS_IAM"
}

resource "aws_lambda_permission" "image_cf_invoke" {
  statement_id  = "AllowCloudFrontInvokeFunction"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.image.function_name
  principal     = "cloudfront.amazonaws.com"
  source_arn    = aws_cloudfront_distribution.this.arn
}
