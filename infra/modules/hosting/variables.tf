# hosting モジュールの入力。

variable "name_prefix" {
  description = "リソース名の接頭辞（例 alp007-aibee-lab-dev）。バケット名・関数名・ポリシー名に使う。"
  type        = string
}

variable "environment" {
  description = "環境名（dev/prod）。タグ・命名の補助に使う。"
  type        = string
}

variable "aws_region" {
  description = "配信リージョン（東京）。server 関数の CACHE_BUCKET_REGION に渡す。"
  type        = string
}

variable "opennext_path" {
  description = <<-EOT
    OpenNext 出力ディレクトリ（.open-next）へのパス。terraform を実行する
    カレントディレクトリ（環境ルート infra/environments/<env>）からの相対、または絶対パス。
    archive_file / file() がこの配下を参照して Lambda zip と BUILD_ID を取得する。
  EOT
  type        = string
}

variable "server_memory_mb" {
  description = "server(SSR) Lambda のメモリ（MB）。"
  type        = number
  default     = 512
}

variable "server_timeout_sec" {
  description = "server(SSR) Lambda のタイムアウト（秒）。Server Action 送信を想定。"
  type        = number
  default     = 15
}

variable "image_memory_mb" {
  description = "image 最適化 Lambda のメモリ（MB）。sharp 変換のため大きめ。"
  type        = number
  default     = 1536
}

variable "image_timeout_sec" {
  description = "image 最適化 Lambda のタイムアウト（秒）。"
  type        = number
  default     = 25
}

variable "log_retention_days" {
  description = "Lambda ロググループの保持日数。"
  type        = number
  default     = 14
}

variable "server_environment" {
  description = <<-EOT
    server(SSR) Lambda に追加注入する環境変数（map）。contact 由来の
    CONTACT_TABLE_NAME / CONTACT_RATE_LIMIT_TABLE_NAME / CONTACT_RATE_LIMIT_SALT /
    SES_SENDER_ADDRESS / CONTACT_NOTIFY_ADDRESS を env root から渡す。値は env root 側で確定させる（テーブル名は name_prefix から組み立て）ことで
    hosting↔contact の循環依存を避ける（hosting は contact のリソースを参照しない）。
  EOT
  type        = map(string)
  default     = {}
}

variable "site_domain" {
  description = "独自ドメイン名（dev: dev.aibee-lab.jp）。CloudFront の aliases と Route53 エイリアス A/AAAA に使う。"
  type        = string
}

variable "acm_certificate_arn" {
  description = <<-EOT
    CloudFront の viewer_certificate に使う ACM 証明書 ARN（us-east-1・検証済み）。
    dns モジュールの出力を環境ルート経由で受け取る（hosting は dns を直接参照しない＝循環回避）。
  EOT
  type        = string
}

variable "route53_zone_id" {
  description = "A/AAAA エイリアスレコードを作る Route53 ホストゾーン ID（dns の zone_id を env 経由で受け取る）。"
  type        = string
}

variable "noindex_enabled" {
  description = <<-EOT
    true で CloudFront のレスポンスヘッダーポリシー（X-Robots-Tag: noindex, nofollow）を全 behavior に適用する。
    dev=true / prod=false。配信層で付けるので HTML 以外（画像・JSON 等）にも一律に効く。
  EOT
  type        = bool
  default     = false
}

variable "basic_auth_enabled" {
  description = "true で CloudFront Function（viewer-request）による Basic 認証を全 behavior に適用（dev=true, prod=false）。"
  type        = bool
  default     = false
}

variable "basic_auth_username" {
  description = <<-EOT
    Basic 認証のユーザー名。※ default="" にしているのは prod（basic_auth_enabled=false）で値を要求しない
    ため（basic_auth_password も同様）。enabled=true のとき空だと aws_cloudfront_function の precondition で
    失敗する。値は関数コードに平文で埋まる（AWS コンソールで読め・state にも残る。§7 の例外）。
  EOT
  type        = string
  default     = ""
  sensitive   = true
}

variable "basic_auth_password" {
  description = <<-EOT
    Basic 認証のパスワード。default="" の意図は basic_auth_username と同じ（prod で値を要求しない）。
    enabled=true のとき空だと precondition で失敗する。値は関数コードに平文で埋まる（§7 の例外）。
  EOT
  type        = string
  default     = ""
  sensitive   = true
}

variable "lambda_runtime" {
  description = <<-EOT
    server / image Lambda の Node ランタイム。ローカル開発（Node24）・OpenNext ビルドと
    配信先を揃える（SITE_ARCHITECTURE.md §2）。nodejs20.x は 2026-04-30 に非推奨のため 24 系。
    OpenNext の handler は async(event)⇒Promise（callback 非依存）、sharp 0.32.6 は Node-API v7
    （ABI 安定・engines 上限なし）で Node24 と互換。
  EOT
  type        = string
  default     = "nodejs24.x"
}

variable "alias_enabled" {
  description = <<-EOT
    CloudFront に独自ドメイン（aliases）を適用するか。dev=true。
    **prod の初回 apply は false** にする：同一ドメイン名は同時に1ディストリビューションにしか
    付けられず（CNAMEAlreadyExists）、旧サイト稼働中はエイリアス付き apply が失敗するため。
    既定ドメイン（*.cloudfront.net）で確認まで済ませ、カットオーバー時に true にする（§7・§9）。
    false のときは aliases・エイリアス A/AAAA を作らず、viewer_certificate も CloudFront 既定証明書になる。
  EOT
  type        = bool
  default     = true
}
