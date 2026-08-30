# レート制限の IP ハッシュ用ソルト（§5）。
#
# 【なぜ必要か】ソルト無しの SHA-256 では IPv4 の空間が約43億しかなく総当たりで元の IP を復元できる。
# 仕様の「記録から元の IP を復元できない」を成立させるために付ける。
#
# 【なぜ Terraform で生成するか】リポジトリにもコードにもソルトを書かずに済み、手作業も要らない
# （§7 の「秘匿値を tfvars に書かない」原則に例外を作らない）。値は state に残るが、これは §7 が
# 認めている性質（state には変数の値が平文で残る）で state バケットは非公開。
# SSM / Secrets Manager は IAM 権限・起動時取得・取得失敗時の扱いで構成が増え、この用途には過剰（§5）。
#
# 【なぜ env root に置くか（モジュールではなく）】ソルトは server Lambda の環境変数として hosting に渡す。
# 一方 contact は hosting の output（server_role_name）を参照している。もし contact 側で生成すると
# hosting → contact（env）と contact → hosting（ロール）で**循環参照**になる。env root で生成して
# hosting に渡せば依存は env root → hosting の一方向で収まる（§7 の「値は env root で確定させる」流儀）。
#
# 【なぜ random_password か】random_string / random_id と機能は同等だが、
# **random_password は result 属性が provider の schema 上 sensitive**。
# plan / apply / output の表示に値が平文で出ず、うっかり露出する事故を防げる。
#
# 【apply のたびに変わらないこと】random_* は作成時に一度だけ値を生成し、以降は state の値をそのまま返す。
# 再生成されるのは keepers を変えた場合か destroy/taint した場合のみ。ここでは keepers を置かない
# ＝再生成の入力が存在しないため、apply を繰り返しても値は変わらない
# （ソルトが変わると既存の記録と照合できなくなる＝その瞬間だけ制限がリセットされる。ローテーションが
#   必要になったらこのリソースを taint して意図的に作り直す）。
resource "random_password" "rate_limit_salt" {
  length = 48
  # 記号は使わない（環境変数として渡すため、シェルや設定画面での取り扱い事故を避ける）。
  # 英大小＋数字の 62 種 × 48 文字で、レインボーテーブルの無効化には十分すぎるエントロピー。
  special = false
}
