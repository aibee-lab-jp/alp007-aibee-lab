# GitHub Actions から AWS を操作するための IAM（§7・§8）。
# 長期アクセスキーを置かず、GitHub Actions が OIDC で IAM ロールを assume する。
# このモジュールが作るのは **ロールとその権限だけ**（OIDC プロバイダは作らない。下記）。

# ---- GitHub Actions の OIDC プロバイダ（作らず data 参照する） ------------
# 1アカウントに同一 URL のプロバイダは1つしか持てず、複数プロジェクト（just47 と本リポ）で
# 共有する。所有リポの destroy／再構築が他リポの CI 認証を壊す構造を避けるため、プロバイダは
# **どのリポの Terraform state にも入れない**（§10 の原則。state バケットと同じ扱い）。
#   URL      = https://token.actions.githubusercontent.com
#   audience = sts.amazonaws.com（公式 AWS アクション使用時）
# dev アカウントには作成済み。prod アカウントは prod 構築前に CLI で作成する（コマンドは §10）。
# 未作成のアカウントでは、この data がエラーになる＝作り忘れがその場で分かる。
data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

# ---- GitHub Actions が assume するロールの信頼ポリシー --------------------
# GitHub 公式の sub クレーム書式に従い、このリポジトリの指定 environment からの実行のみに限定する。
#   aud = sts.amazonaws.com
#   sub = repo:<owner/repo>:environment:<environment>
#         本リポ dev では repo:aibee-lab-jp/alp007-aibee-lab:environment:dev
#
# 【書式の根拠】ジョブが `environment:` を参照すると、GitHub OIDC の sub は ref ベース
#   （repo:...:ref:refs/heads/<branch>）ではなく **environment ベース**になる（GitHub 公式
#   "About security hardening with OpenID Connect"：sub にブランチ/タグ名が入るのは「ジョブが
#   environment を参照しておらず、かつ pull_request でない」場合に限る）。本リポの両ワークフローは
#   `environment: dev` を指定するため、実際に届く sub は environment ベース。ref ベースの条件では
#   一致せず assume が拒否される（just47 で実証済み。§7）。
#
# 【immutable subject claims】2026-07-15 以降に作成されたリポジトリは sub が ID 入り書式
#   （repo:owner@ID/repo@ID:...）になりうるため、§7 は初回に実書式を確認することを求めている。
#   本リポでは **immutable subject claims は無効（＝標準書式）であることを実測で確認済み**のため、
#   下記のとおり標準書式で書く。将来 GitHub 側の既定が変わった場合は、実際に届く sub を確認して
#   ここを直す（AccessDenied で失敗するため、変化には気づける）。
#
# 【ブランチ制限の所在が移ることの明記】environment ベースの sub には **ブランチ情報が含まれない**ため、
#   AWS 側の信頼ポリシーではブランチを判定できない。ブランチ制限は **GitHub Environments の
#   Deployment branches 設定**（dev 環境へのデプロイ元を develop に限定）が担う。
#   ＝「repo＋environment」を AWS 側で、「どのブランチからその environment へデプロイできるか」を
#   GitHub 側で限定する二段構え（§8）。
data "aws_iam_policy_document" "assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = [local.trust_subject]
    }
  }
}

locals {
  trust_subject = "repo:${var.github_repository}:environment:${var.environment}"
}

resource "aws_iam_role" "github_actions" {
  name               = "${var.name_prefix}-github-actions"
  assume_role_policy = data.aws_iam_policy_document.assume.json

  tags = {
    Name = "${var.name_prefix}-github-actions"
  }
}

# ---- CI が必要とする権限（サービス単位のワイルドカード。§7） --------------
# 理由：Terraform は apply のたびに大量の読み取り（Describe*/Get*/List*）を行い、アクション単位の
# 列挙は現実的でない。本サイトは静的サイト＋フォーム1本の小さな構成のため、サービス単位で必要十分と
# 判断した。守りは信頼ポリシー（repo＋environment 限定）と GitHub 側のブランチ制限が担う。
# dev で必要権限を実践的に確定し、その内容を prod にも適用する（§7）。
#
# 対象は hosting/contact/dns の各モジュールが作るもの＋CI が直接叩くもの：
#   s3        … 静的アセットバケット／Terraform state バケット（＋ネイティブ lockfile）／aws s3 sync
#   cloudfront… ディストリビューション・各ポリシー・OAC・Functions・invalidation
#   lambda    … server/image 関数・Function URL・permission
#   iam       … 各実行ロール・インラインポリシー・PassRole・このロール自身の更新
#               （OIDC プロバイダは管理外だが、上の data 参照に Get が要る）
#   dynamodb  … 問い合わせ保存／レート制限の2テーブル（contact）
#   ses       … 送信ドメイン ID・DKIM（contact。SESv2 も IAM アクションは ses:*）
#   route53   … dev.aibee-lab.jp ホストゾーン・ACM 検証 CNAME・DKIM CNAME・エイリアス A/AAAA（dns）
#   acm       … CloudFront 用証明書（us-east-1）
#   logs      … Lambda ロググループ
#   sts       … GetCallerIdentity 等（Terraform / data ソース）
data "aws_iam_policy_document" "permissions" {
  statement {
    sid    = "TerraformManageAndDeploy"
    effect = "Allow"
    actions = [
      "s3:*",
      "cloudfront:*",
      "lambda:*",
      "iam:*",
      "dynamodb:*",
      "ses:*",
      "route53:*",
      "acm:*",
      "logs:*",
      "sts:*",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "permissions" {
  name   = "${var.name_prefix}-github-actions"
  role   = aws_iam_role.github_actions.id
  policy = data.aws_iam_policy_document.permissions.json
}
