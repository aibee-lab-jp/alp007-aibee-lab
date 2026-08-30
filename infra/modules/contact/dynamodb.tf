# 問い合わせ保存用 DynamoDB テーブル（§5：一次記録＝受付の成否）。
# - PAY_PER_REQUEST（オンデマンド）。低頻度・スパイク型のフォーム送信に適し、容量管理不要。
# - hash_key = "id" のみ。他属性はスキーマレス（DynamoDB は key 以外を事前定義しない）。
# - ソートキー・GSI なし。
# - point_in_time_recovery 有効（一次記録の保護）。
# ※ ISR 用 DynamoDB とは無関係（§7：ISR 用は作らない。これは §5 のフォーム保存用）。
resource "aws_dynamodb_table" "contacts" {
  name         = var.table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = var.table_name
  }
}

# 送信レート制限用テーブル（§5「送信レート制限」）。
# 問い合わせ保存用テーブルに相乗りせず専用テーブルにする理由（§5）：
#   1. プライバシー … 問い合わせ本文と IP を同じテーブルに無期限で同居させない
#      （問い合わせ記録は「後から AI で整理する」ため長期保持する資産で、そこに IP を混ぜない）。
#   2. TTL で自動削除できる … 判定にしか使わない記録なので 1時間程度で消えてよい。
#
# 【キー設計】PK = ipHash（S）／ SK = sentAt（N・epoch ミリ秒）。
#   §5 の判定は「1時間分を1回引いて、そのうち直近1分を数える」。この形なら
#   Query（KeyConditionExpression: ipHash = :h AND sentAt >= :from）で、
#   ある ipHash の直近1時間の記録だけを時刻順に1回で取得でき、1分の判定はその結果を数えるだけで済む。
#   ipHash を PK にすることで IP ごとにパーティションが分かれ、他 IP の記録を読まない（Scan 不要）。
#   sentAt を SK にすることで時刻の範囲条件と時刻順の取得が成立する（同一 ipHash 内でユニークにもなる）。
#   ※ IP はハッシュ化して保存する（§5）。テーブルは値の中身を問わないため、ハッシュ化はアプリ側の責務。
#
# 【TTL】expiresAt（epoch 秒）。DynamoDB の TTL は **削除に遅延がありうる**（最大数日）ため、
#   これは「記録が無限に溜まるのを防ぐ」ためのものであり、判定の正確性は担保しない。
#   判定側は必ず保存された sentAt で絞り込む前提（TTL 切れの残骸が読めても窓の外なら無視される）。
#
# 【point_in_time_recovery は無効】既存の contacts テーブルとは扱いを変える。
#   contacts は「受付の一次記録」で復旧の価値があるが、こちらは 1時間で消える一時データで、
#   失っても再作成されるだけ（バックアップに保持する意味がなく、IP 由来の情報を余計に残さない方がよい）。
resource "aws_dynamodb_table" "rate_limit" {
  name         = var.rate_limit_table_name
  billing_mode = "PAY_PER_REQUEST" # 既存テーブルに揃える（低頻度・スパイク型）
  hash_key     = "ipHash"
  range_key    = "sentAt"

  attribute {
    name = "ipHash"
    type = "S"
  }

  attribute {
    name = "sentAt"
    type = "N"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = {
    Name = var.rate_limit_table_name
  }
}
