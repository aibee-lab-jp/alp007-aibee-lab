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
