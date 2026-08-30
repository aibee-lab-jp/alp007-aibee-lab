# SES（SESv2）。ドメイン検証（Easy DKIM）を Route53 レコードまで Terraform で完結させる（§5）。
#
# スコープ外（作らない）：カスタム MAIL FROM ドメイン、SPF/DMARC、サンドボックス解除（本番アクセス申請）。
#
# 【通知先 admin@aibee-lab.jp の email identity はここで作らない・参照もしない】
#   §10 の共有アカウント資源のため、**どのリポジトリの Terraform state にも入れない**（作成は CLI で
#   アカウントごとに1回。dev は作成・verify 済み）。本リポの送信コードは宛先アドレスを tfvars 由来の
#   設定値（CONTACT_NOTIFY_ADDRESS）として受け取るだけで、identity リソースへの参照を持たない（§5・§10）。

# ---- 送信ドメイン ID（dev.aibee-lab.jp）＋ Easy DKIM ----------------------
# SESv2 の domain identity は Easy DKIM が既定で有効になり、検証は DKIM CNAME で完了する
# （SES classic の _amazonses TXT は不要）。dkim_signing_attributes.tokens に3トークンが computed で入る。
resource "aws_sesv2_email_identity" "domain" {
  email_identity = var.ses_domain

  # Easy DKIM（AWS 管理鍵）。BYODKIM の private_key/selector は指定しない。
  dkim_signing_attributes {
    next_signing_key_length = "RSA_2048_BIT"
  }

  tags = {
    Name = var.ses_domain
  }
}

# Easy DKIM の CNAME（常に3本）。トークン値は apply 後確定（known after apply）だが、
# 本数は Easy DKIM で固定3のため count は静的リテラル 3 でよい（count が apply 依存にならない。§5）。
#   name  : <token>._domainkey.<domain>
#   value : <token>.dkim.amazonses.com
# この3本が伝播するとドメインが verified になる（＝ドメイン検証も兼ねる）。
resource "aws_route53_record" "dkim" {
  count   = 3
  zone_id = var.route53_zone_id
  name    = "${aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens[count.index]}._domainkey.${var.ses_domain}"
  type    = "CNAME"
  ttl     = var.dkim_ttl
  records = ["${aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens[count.index]}.dkim.amazonses.com"]
}
