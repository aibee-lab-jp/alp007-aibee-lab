# 既存の server Lambda 実行ロール（hosting が作成）へ、フォーム処理用の権限を追加する。
# 【重要】ロールは新規に作らない。hosting の output（server_role_name）で受け取ったロールに
# インラインポリシーを足すだけ（二重作成回避）。
#
# 付与するのは §5 の Server Action（問い合わせ送信）が使う3つ：
#   (a) DynamoDB PutItem … 当該テーブル ARN に限定。
#   (b) SES(SESv2) SendEmail … アカウント／リージョン内の全 identity（identity/*）を対象。

# region / account_id をハードコードしないための取得元（ARN 組み立てに使用）。
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "aws_iam_policy_document" "contact" {
  statement {
    sid       = "ContactTablePutItem"
    effect    = "Allow"
    actions   = ["dynamodb:PutItem"]
    resources = [aws_dynamodb_table.contacts.arn]
  }

  # (c) レート制限テーブル（§5）。必要最小限の2アクションのみ：
  #   Query   … 「ipHash の直近1時間の記録を時刻順に引く」判定の読み取り（Scan/GetItem では成立しない）。
  #   PutItem … 送信1件ごとの記録の書き込み。
  # 削除は TTL が行うため DeleteItem は不要。集計は取得結果を数えるだけなので UpdateItem も不要。
  statement {
    sid       = "RateLimitTableAccess"
    effect    = "Allow"
    actions   = ["dynamodb:Query", "dynamodb:PutItem"]
    resources = [aws_dynamodb_table.rate_limit.arn]
  }

  statement {
    sid     = "SendContactEmails"
    effect  = "Allow"
    actions = ["ses:SendEmail"]
    # SESv2 SendEmail の IAM アクションは ses:SendEmail。
    #
    # 【なぜ identity/* に広げるか】SES は SendEmail を認可する際、送信元だけでなく
    # **宛先（recipient）side の identity ARN に対しても認可チェック**を行う（特にサンドボックスでは
    # 宛先も検証済み identity 必須）。Resource を送信元ドメイン ID（identity/dev.aibee-lab.jp）だけに
    # 限定していたため、宛先 identity（確認メール宛の訪問者アドレス／通知先 admin@aibee-lab.jp）で
    # AccessDeniedException になっていた（実ログで確認）。そこでアカウント／リージョン内の
    # 全 identity を対象に広げる。"*"（全リソース）にはせず identity/* に留める。
    # region/account はハードコードせず data ソースから組み立てる。
    resources = [
      "arn:aws:ses:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:identity/*",
    ]

    # 【ses:FromAddress 条件は付けない】アプリは @aws-sdk/client-sesv2 の SendEmailCommand（SESv2）で
    # 送信しているが、ses:FromAddress は SES v1 系・sending authorization policy 向けの条件キーで、
    # SESv2 の SendEmail で IAM 認可コンテキストに渡され評価されるかが公式に不明確（SESv2 はタグベース
    # 認可が中心で従来の email 条件キーは非対応の可能性／Service Authorization Reference・SES 開発者ガイド）。
    # もし SES が本キーを渡さないと StringEquals が偽になり全送信が拒否され、今と同じ症状に戻るため、
    # 「曖昧なら付けない」方針に従い条件なしとする。
  }
}

resource "aws_iam_role_policy" "contact" {
  name   = "${var.name_prefix}-contact"
  role   = var.server_role_name
  policy = data.aws_iam_policy_document.contact.json
}
