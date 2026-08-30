# dev 環境の env 別値（§7：環境差は backend.hcl と terraform.tfvars の2ファイルだけが持つ）。
# terraform は同ディレクトリの terraform.tfvars を自動読み込みする。このファイルはコミットする。
# 秘匿値は書かない（この段階では該当なし。dev の Basic 認証だけが明示的な例外で、hosting 追加時に足す）。

environment = "dev"
name_prefix = "alp007-aibee-lab-dev"

# --- ドメイン / DNS（§7） ---
site_domain     = "dev.aibee-lab.jp" # ACM 証明書の主ドメイン。NEXT_PUBLIC_SITE_URL の組み立て元
dns_zone_name   = "dev.aibee-lab.jp" # dev はサイトのドメイン＝ゾーン（prod は apex aibee-lab.jp になる）
dns_create_zone = true               # dev は新規作成。apply 後に NS 4本を prod アカウントへ手作業で委譲（§9 ステップ1）
# certificate_subject_alternative_names は dev では不要（既定の [] のまま）。prod で apex を足す

# --- アプリのビルド時設定（NEXT_PUBLIC_*）。§2：Terraform が唯一の情報源 ---
portal_url = "https://dev.just47.jp" # 「とりあえず47」への導線（dev は dev 同士で閉じる）

# --- CloudFront の配信オプション（§7） ---
alias_enabled   = true # dev は最初から独自ドメイン（dev.aibee-lab.jp）を付ける
noindex_enabled = true # dev は検索回避（X-Robots-Tag: noindex, nofollow）

# --- Basic 認証（dev のみ） ---
# 【重要】以下のユーザー名・パスワードは「秘匿値を tfvars に書かない」原則の **明示的な例外**です（§7）。
# ここに認証情報を書いてよい理由：
#  ・保護対象は「未公開コンテンツを関係者以外に見せない」程度で、漏洩時の被害が限定的
#    （暗号鍵や API キーとは性質が異なる）。
#  ・CloudFront Functions は外部サービスを呼べないため、値はどのみち関数コードに平文で埋め込まれる
#    （AWS コンソールで読め、Terraform の state にも残る）。SSM 等から読んでも守れるのは
#    「Git に書かれないこと」だけで、実効的な保護はほとんど増えない。
# ※ パスワードにコロン（:）は使わない（Basic 認証の連結子のため。§7）。
# ※ 値は仮のプレースホルダ。実際の値はオーナーが編集する（apply 前に差し替えること）。
basic_auth_enabled  = true
basic_auth_username = "REPLACE_ME_USER"
basic_auth_password = "REPLACE_ME_PASSWORD"

# --- 問い合わせフォーム（§5） ---
ses_sender_address     = "no-reply@dev.aibee-lab.jp" # ドメイン部 dev.aibee-lab.jp が SES 検証ドメインになる
contact_notify_address = "admin@aibee-lab.jp"        # 通知先（identity は Terraform 管理外・verify 済み。§10）
