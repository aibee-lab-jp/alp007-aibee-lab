# dev 環境の env 別値（§7：環境差は backend.hcl と terraform.tfvars の2ファイルだけが持つ）。
# terraform は同ディレクトリの terraform.tfvars を自動読み込みする。このファイルはコミットする。
# 秘匿値は書かない（この段階では該当なし。dev の Basic 認証だけが明示的な例外で、hosting 追加時に足す）。

environment = "dev"
name_prefix = "alp007-aibee-lab-dev"
