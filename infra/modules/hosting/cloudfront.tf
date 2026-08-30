# CloudFront ディストリビューション。
#
# open-next.output.json の behaviors を CloudFront に対応させる（CloudFront は
# 「順序つき behavior を上から評価し最初に一致したもの」＋「既定 behavior＝catch-all」）：
#
#   pattern         origin          → CloudFront での扱い
#   *               default(server) → 既定 behavior（catch-all）= server
#   _next/image*    imageOptimizer  → 順序 behavior #1 = image
#   _next/data/*    default(server) → 順序 behavior #2 = server
#   _next/*         s3              → 順序 behavior #3 = s3（image/data より後）
#   BUILD_ID        s3              → 順序 behavior #4 = s3
#   favicon.ico     s3              → 順序 behavior #5 = s3
#   sw.js           s3              → 順序 behavior #6 = s3（キャッシュ無効。§5）
#
# ※ _next/image* と _next/data/* は _next/* より前に置く（でないと _next/* が先に食う）。

# ---- Function URL 用 OAC（lambda タイプ。sigv4 常時署名） ----------------
resource "aws_cloudfront_origin_access_control" "lambda" {
  name                              = "${var.name_prefix}-lambda-oac"
  description                       = "OAC for ${var.name_prefix} lambda function URLs"
  origin_access_control_origin_type = "lambda"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ---- キャッシュ / オリジンリクエストポリシー ----------------------------
# 静的・動的は AWS マネージドを流用。画像だけ専用に用意（url/w/q と Accept でキャッシュ）。
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

# 動的（server）向け：Host 以外の全ビューワ値をオリジンへ転送（Function URL は Host を上書きするため Host は除外）。
# ※ レート制限が使う CloudFront-Viewer-Address もこのポリシーで転送される（§5）。
data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

# 画像最適化向けキャッシュポリシー：クエリ url/w/q ＋ Accept でキャッシュを分ける。
resource "aws_cloudfront_cache_policy" "image" {
  name        = "${var.name_prefix}-image"
  default_ttl = 86400
  min_ttl     = 0
  max_ttl     = 31536000

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true

    query_strings_config {
      query_string_behavior = "whitelist"
      query_strings {
        items = ["url", "w", "q"]
      }
    }
    headers_config {
      header_behavior = "whitelist"
      headers {
        items = ["Accept"]
      }
    }
    cookies_config {
      cookie_behavior = "none"
    }
  }
}

# 画像最適化向けオリジンリクエストポリシー：Accept ヘッダと url/w/q クエリだけ転送（Host は転送しない）。
resource "aws_cloudfront_origin_request_policy" "image" {
  name = "${var.name_prefix}-image"

  headers_config {
    header_behavior = "whitelist"
    headers {
      items = ["Accept"]
    }
  }
  query_strings_config {
    query_string_behavior = "whitelist"
    query_strings {
      items = ["url", "w", "q"]
    }
  }
  cookies_config {
    cookie_behavior = "none"
  }
}

# ---- noindex 用レスポンスヘッダーポリシー ------------------------------
# dev の検索回避：X-Robots-Tag: noindex, nofollow を配信層で付与（HTML 以外にも一律に効く。§7）。
# 【条件付き作成（count）にした理由】prod（noindex 無効）では未使用のポリシーを一切作らず state を
# きれいに保てる。割り当ては全 behavior に response_headers_policy_id で行い、無効時は下の
# local.noindex_policy_id が null＝どの behavior にも付かない（既存のキャッシュ/リクエストポリシーは不変）。
resource "aws_cloudfront_response_headers_policy" "noindex" {
  count = var.noindex_enabled ? 1 : 0
  name  = "${var.name_prefix}-noindex"

  custom_headers_config {
    items {
      header   = "X-Robots-Tag"
      value    = "noindex, nofollow"
      override = true
    }
  }
}

# ---- Basic 認証（CloudFront Function・viewer-request） -------------------
# dev の未公開コンテンツを関係者以外に見せないための軽い保護。noindex と同じ「条件付き作成＋one()」の流儀。
# CloudFront Functions は外部サービスを呼べないため、認証情報は関数コードに平文で埋め込む（§7 の明示的例外）。
# 期待する Authorization 値（"Basic <base64(user:pass)>"）は Terraform 側で base64encode して注入し、
# 関数内では文字列比較のみ（関数内で base64 を扱わずに済み、ランタイム依存を減らせる）。
# ランタイムは AWS 現行推奨の cloudfront-js-2.0。
resource "aws_cloudfront_function" "basic_auth" {
  count   = var.basic_auth_enabled ? 1 : 0
  name    = "${var.name_prefix}-basic-auth"
  runtime = "cloudfront-js-2.0"
  comment = "Basic auth (viewer-request) for ${var.name_prefix}"
  publish = true

  code = templatefile("${path.module}/functions/basic-auth.js.tftpl", {
    expected_authorization = "Basic ${base64encode("${var.basic_auth_username}:${var.basic_auth_password}")}"
    realm                  = var.site_domain
  })

  # 変数は prod で値を要求しないよう default="" にしているため、有効時だけ資格情報の非空を強制する。
  lifecycle {
    precondition {
      condition     = var.basic_auth_username != "" && var.basic_auth_password != ""
      error_message = "basic_auth_enabled = true のときは basic_auth_username と basic_auth_password を空にできません。"
    }
  }
}

locals {
  # いずれも無効時は空リスト → one() が null。null のとき behavior 側は未割り当て
  # （noindex は response_headers_policy_id=null、basic 認証は dynamic function_association 未生成）。
  noindex_policy_id       = one(aws_cloudfront_response_headers_policy.noindex[*].id)
  basic_auth_function_arn = one(aws_cloudfront_function.basic_auth[*].arn)
}

# ---- ディストリビューション -------------------------------------------
resource "aws_cloudfront_distribution" "this" {
  enabled         = true
  comment         = "${var.name_prefix} aibee-lab site hosting"
  price_class     = "PriceClass_200" # アジアのエッジを含める（配信は日本中心）。
  http_version    = "http2and3"
  is_ipv6_enabled = true

  # 独自ドメイン（既定ドメイン *.cloudfront.net での配信も継続する）。
  # alias_enabled=false のときは空＝既定ドメインのみ（prod の初回 apply。main.tf の locals 参照）。
  aliases = local.aliases

  # 静的アセット（S3・OAC 経由）。
  origin {
    origin_id                = "s3"
    domain_name              = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
    origin_path              = "/${local.assets_prefix}" # _assets 配下を配信。
  }

  # server(SSR) Function URL。
  origin {
    origin_id                = "server"
    domain_name              = element(split("/", aws_lambda_function_url.server.function_url), 2)
    origin_access_control_id = aws_cloudfront_origin_access_control.lambda.id

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # image 最適化 Function URL。
  origin {
    origin_id                = "image"
    domain_name              = element(split("/", aws_lambda_function_url.image.function_url), 2)
    origin_access_control_id = aws_cloudfront_origin_access_control.lambda.id

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # 全 behavior（既定＋順序6）に noindex（response_headers_policy_id）と Basic 認証
  # （dynamic function_association / viewer-request）を割り当てる。いずれも無効時は local が null で
  # 未割り当て。**割り当てのない behavior は素通りする**ため、Basic 認証は全 behavior に付ける（§7）。

  # 既定 behavior（catch-all "*"）→ server。Server Action(POST) を通すため全メソッド許可・キャッシュ無効。
  default_cache_behavior {
    target_origin_id           = "server"
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id   = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
    response_headers_policy_id = local.noindex_policy_id

    dynamic "function_association" {
      for_each = local.basic_auth_function_arn == null ? [] : [1]
      content {
        event_type   = "viewer-request"
        function_arn = local.basic_auth_function_arn
      }
    }
  }

  # #1 _next/image* → image
  ordered_cache_behavior {
    path_pattern               = "_next/image*"
    target_origin_id           = "image"
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = aws_cloudfront_cache_policy.image.id
    origin_request_policy_id   = aws_cloudfront_origin_request_policy.image.id
    response_headers_policy_id = local.noindex_policy_id

    dynamic "function_association" {
      for_each = local.basic_auth_function_arn == null ? [] : [1]
      content {
        event_type   = "viewer-request"
        function_arn = local.basic_auth_function_arn
      }
    }
  }

  # #2 _next/data/* → server（動的。Host 以外転送・キャッシュ無効）
  ordered_cache_behavior {
    path_pattern               = "_next/data/*"
    target_origin_id           = "server"
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id   = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
    response_headers_policy_id = local.noindex_policy_id

    dynamic "function_association" {
      for_each = local.basic_auth_function_arn == null ? [] : [1]
      content {
        event_type   = "viewer-request"
        function_arn = local.basic_auth_function_arn
      }
    }
  }

  # #3 _next/* → S3（長期キャッシュ。ハッシュ付きで不変）
  ordered_cache_behavior {
    path_pattern               = "_next/*"
    target_origin_id           = "s3"
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = data.aws_cloudfront_cache_policy.caching_optimized.id
    response_headers_policy_id = local.noindex_policy_id

    dynamic "function_association" {
      for_each = local.basic_auth_function_arn == null ? [] : [1]
      content {
        event_type   = "viewer-request"
        function_arn = local.basic_auth_function_arn
      }
    }
  }

  # #4 BUILD_ID → S3
  ordered_cache_behavior {
    path_pattern               = "BUILD_ID"
    target_origin_id           = "s3"
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = data.aws_cloudfront_cache_policy.caching_optimized.id
    response_headers_policy_id = local.noindex_policy_id

    dynamic "function_association" {
      for_each = local.basic_auth_function_arn == null ? [] : [1]
      content {
        event_type   = "viewer-request"
        function_arn = local.basic_auth_function_arn
      }
    }
  }

  # #5 favicon.ico → S3
  ordered_cache_behavior {
    path_pattern               = "favicon.ico"
    target_origin_id           = "s3"
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = data.aws_cloudfront_cache_policy.caching_optimized.id
    response_headers_policy_id = local.noindex_policy_id

    dynamic "function_association" {
      for_each = local.basic_auth_function_arn == null ? [] : [1]
      content {
        event_type   = "viewer-request"
        function_arn = local.basic_auth_function_arn
      }
    }
  }

  # #6 sw.js → S3（public/sw.js が _assets/sw.js として配信される。favicon.ico と同じベア表記）。
  # ただしキャッシュは CachingOptimized（長期）ではなく **CachingDisabled**（§5）。
  # 理由：Service Worker スクリプトは更新が速やかに届く必要がある。長期キャッシュだと CloudFront が
  # 旧 sw.js を返し続け、ブラウザの SW 更新チェック（登録側は updateViaCache:"none"）が
  # エッジの古いコピーに当たって更新が遅延する。tiny かつ低頻度取得のため無効化のコストは小さい。
  ordered_cache_behavior {
    path_pattern               = "sw.js"
    target_origin_id           = "s3"
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = data.aws_cloudfront_cache_policy.caching_disabled.id
    response_headers_policy_id = local.noindex_policy_id

    dynamic "function_association" {
      for_each = local.basic_auth_function_arn == null ? [] : [1]
      content {
        event_type   = "viewer-request"
        function_arn = local.basic_auth_function_arn
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # 独自ドメイン用 ACM 証明書（us-east-1・検証済み。dns モジュール由来）。
  # alias_enabled=false のときは独自ドメインを持たないため CloudFront 既定証明書に切り替える
  # （aliases が空のまま ACM 証明書だけを付けることはできない）。
  viewer_certificate {
    cloudfront_default_certificate = var.alias_enabled ? null : true
    acm_certificate_arn            = var.alias_enabled ? var.acm_certificate_arn : null
    # SNI（Server Name Indication）で複数証明書を共有。専用 IP（vip）は不要でコスト増を避ける。
    ssl_support_method = var.alias_enabled ? "sni-only" : null
    # AWS 現行推奨の最小 TLS（SNI 併用時）。古い TLS1.0/1.1 を無効化。
    minimum_protocol_version = var.alias_enabled ? "TLSv1.2_2021" : null
  }
}

# 独自ドメイン → CloudFront のエイリアス。A（IPv4）と AAAA（IPv6）の両方を作る
# （CloudFront は既定で IPv6 有効。AAAA が無いと IPv6 のみの環境から引けない。追加コストなし。§7）。
# エイリアス先のホストゾーン ID は CloudFront 固有の固定値（Z2FDTNDATAQYW2）だが、ハードコードせず
# distribution の hosted_zone_id 属性を使う（provider 提供・自己文書化・将来変更にも追従）。
# zone_id は dns モジュールの出力を環境ルート経由で受け取る（hosting は dns を直接参照しない＝循環回避）。
# alias_enabled=false のときは作らない（エイリアス未設定の CloudFront に向けると 403 になるため）。
resource "aws_route53_record" "alias_a" {
  count   = var.alias_enabled ? 1 : 0
  zone_id = var.route53_zone_id
  name    = var.site_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.this.domain_name
    zone_id                = aws_cloudfront_distribution.this.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "alias_aaaa" {
  count   = var.alias_enabled ? 1 : 0
  zone_id = var.route53_zone_id
  name    = var.site_domain
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.this.domain_name
    zone_id                = aws_cloudfront_distribution.this.hosted_zone_id
    evaluate_target_health = false
  }
}
