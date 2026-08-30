# ACM 証明書（CloudFront 用は us-east-1 必須。§7）＋ DNS 検証。
#
# 対象ドメインは環境で異なる：
#   dev  … dev.aibee-lab.jp（SAN なし）
#   prod … www.aibee-lab.jp ＋ SAN に apex aibee-lab.jp（apex → www の 301 を CloudFront で行うため、
#          apex 側にも証明書が要る。§7・§9 ステップ2）
# 証明書は CloudFront より先に用意しておける（旧サイト稼働中でも検証 CNAME を足すだけで影響しない）。

resource "aws_acm_certificate" "cert" {
  provider                  = aws.us_east_1
  domain_name               = var.certificate_domain_name
  subject_alternative_names = var.certificate_subject_alternative_names
  validation_method         = "DNS"

  # 差し替え時に無停止で入れ替えられるように。
  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = var.certificate_domain_name
  }
}

# 検証レコードをこのモジュールのゾーン（作成 or 参照）に作る。
# for_each（domain_validation_options を domain_name でキー化）を使う理由：キー（ドメイン名）は
# plan 時に確定するため、count（要素数が apply 依存になりうる）より堅い。SAN を足しても安全。
# allow_overwrite は、同名の検証レコードが既にある場合（再作成・prod の既存ゾーン）に備える。
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id         = local.zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 300
  allow_overwrite = true
}

# 発行完了を待つ。これが無いと CloudFront が未発行の証明書を参照して apply が失敗する（§7）。
#
# 【dev の初回だけの注意】検証レコードは新設した dev.aibee-lab.jp ゾーンに作られるが、
# 親（prod アカウントの aibee-lab.jp）からの NS 委譲が済むまで公開 DNS からは引けないため、
# ACM の検証は完了しない。初回 apply はここで待ち状態になるので、その間に AWS コンソール等で
# 新ゾーンの NS 4本を確認し、prod アカウント側へ手作業で登録する（§9 ステップ1）。
# 登録が伝播すれば数分で検証が完了し、apply が最後まで進む。
resource "aws_acm_certificate_validation" "cert" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}
