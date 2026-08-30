// 問い合わせ送信のレート制限（§5「送信レート制限」）。**サーバ専用**。
// WAF も API Gateway も採らないため Server Action の中で実装する。
//
// 判定単位は IP アドレス（メールアドレス単位は偽装が容易）。IP はハッシュ化して保存し、
// 記録は専用テーブル（問い合わせ保存用とは別）に置いて TTL で自動削除する。
//
// 【fail open】Query / PutItem が失敗しても送信は通す。レート制限は認証ではなくスパム対策であり、
// 障害時に正常な利用者を締め出す方が損失が大きい（§5）。失敗は console.error でログに残す
// （runtime では Lambda の CloudWatch に出る）。

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

// Lambda のウォーム再利用のためモジュールスコープで生成。
const ddbDoc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// ---- 閾値（§5。変更しやすいよう1箇所に集約） ----
const LIMITS = {
  shortWindowMs: 60_000, // 1分
  shortMax: 3, // 1分に3件まで（4件目を拒否）
  longWindowMs: 60 * 60_000, // 1時間
  longMax: 20, // 1時間に20件まで（21件目を拒否）
  // TTL は判定窓（1時間）より長くする。DynamoDB の TTL 削除は遅延しうるため短くしてはならない。
  recordTtlMs: 2 * 60 * 60_000, // 保存時刻 + 2時間
} as const;

function tableName(): string {
  const v = process.env.CONTACT_RATE_LIMIT_TABLE_NAME;
  if (!v) throw new Error("Missing required environment variable: CONTACT_RATE_LIMIT_TABLE_NAME");
  return v;
}

/**
 * リクエスト元 IP を取得する。取得できなければ null（呼び出し側は fail open でスキップ）。
 *
 * 【ヘッダーの選択】CloudFront が付与する `CloudFront-Viewer-Address` を使う。
 * - CloudFront はこのヘッダーを**エッジで自ら付与**するため、クライアントが同名ヘッダーを送っても
 *   CloudFront の値で上書きされる＝偽装できない（AWS「Add CloudFront request headers」）。
 * - 対して `X-Forwarded-For` はクライアントが自由に付けられ、CloudFront は既存の値に**追記**する
 *   （＝先頭は攻撃者が仕込んだ任意の値になりうる）ため、そのまま信用してはいけない。
 * - 本サイトの既定 behavior は Managed-AllViewerExceptHostHeader を使っており、このポリシーは
 *   「HTTP protocol・HTTP version・TLS version・**全ての device type と viewer location ヘッダー**」
 *   を追加で含む。`CloudFront-Viewer-Address` は viewer location ヘッダーに分類されるため origin に届く。
 * - 形式は `IP:port`（例 `198.51.100.10:46532`／IPv6 は `[2001:db8::1]:46532`）。ポートは毎回変わるので
 *   必ず除去する（付けたままだと同一 IP が別扱いになりレート制限が機能しない）。
 */
export async function getClientIp(): Promise<string | null> {
  try {
    const h = await headers();
    const raw = h.get("cloudfront-viewer-address");
    if (!raw) return null;
    return stripPort(raw.trim()) || null;
  } catch (err) {
    // ヘッダーが読めない環境（想定外）でも送信は止めない。
    console.error("[rate-limit] クライアント IP の取得に失敗（制限をスキップ）:", err);
    return null;
  }
}

// "198.51.100.10:46532" → "198.51.100.10" ／ "[2001:db8::1]:46532" → "2001:db8::1"
function stripPort(value: string): string {
  if (value.startsWith("[")) {
    const end = value.indexOf("]");
    return end > 0 ? value.slice(1, end) : value;
  }
  // IPv4（またはポート無しの IPv6）。コロンが1つだけなら "IP:port" とみなす。
  const i = value.lastIndexOf(":");
  if (i > 0 && value.indexOf(":") === i) return value.slice(0, i);
  return value;
}

/**
 * IP をソルト付きでハッシュ化する（記録から元の IP を復元できないようにする・§5）。
 * ソルトは Terraform が生成し、環境変数 CONTACT_RATE_LIMIT_SALT で渡る（リポジトリには入らない）。
 *
 * ※ ソルト無しの SHA-256 では、IPv4 の空間が約43億しかなく総当たりで復元できてしまう。
 * ※ ソルトが変わると既存の記録と照合できなくなる（＝その瞬間だけ制限がリセットされる）。
 */
function hashIpWithSalt(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/**
 * IP をハッシュ化する。ソルトが未設定なら **null** を返す（＝呼び出し側はレート制限をスキップ）。
 *
 * 【ソルトが無い場合の挙動＝レート制限をスキップ（fail open）＋ console.error】
 *  - ソルト無しでハッシュ化して続行しない：仕様（§5）が要求する「復元できない」を満たさない値を
 *    保存してしまい、しかも動いているように見えるため設定漏れに気づけない（最悪の組み合わせ）。
 *  - 例外にして送信を止めない：§5 は「判定に失敗したときは送信を通す（fail open）」と決めている。
 *    レート制限は認証ではなくスパム対策で、設定漏れで正常な利用者を締め出す方が損失が大きい。
 *  - 代わりに console.error を出す（CloudWatch に残る）。設定漏れはログで検知する。
 *    なお env が欠けていれば PutItem/Query も同様に落ちるため、静かに壊れ続けることはない。
 */
export function hashIp(ip: string): string | null {
  const salt = process.env.CONTACT_RATE_LIMIT_SALT;
  if (!salt) {
    console.error(
      "[rate-limit] CONTACT_RATE_LIMIT_SALT が未設定のため、レート制限をスキップします（fail open）。",
    );
    return null;
  }
  return hashIpWithSalt(ip, salt);
}

export type RateLimitDecision = {
  limited: boolean; // true なら制限に達している（送信を拒否する）
  ipHash: string | null; // 記録用。IP 不明なら null
};

/**
 * 直近1時間の記録を1回の Query で引き、1時間の件数と直近1分の件数から判定する（§5）。
 * 拒否するのは「1分に3件以上」または「1時間に20件以上」＝ 1分の4件目 / 1時間の21件目から。
 * 失敗時は fail open（limited: false）。
 */
export async function checkRateLimit(ip: string | null): Promise<RateLimitDecision> {
  if (!ip) return { limited: false, ipHash: null }; // IP 不明＝スキップ（fail open）

  const ipHash = hashIp(ip);
  // ソルト未設定＝ハッシュ化できない＝スキップ（fail open。理由は hashIp のコメント参照）。
  if (!ipHash) return { limited: false, ipHash: null };

  const now = Date.now();

  try {
    const res = await ddbDoc.send(
      new QueryCommand({
        TableName: tableName(),
        // ipHash 配下を時刻の範囲で引く（PK=ipHash / SK=sentAt のキー設計）。
        KeyConditionExpression: "ipHash = :h AND sentAt >= :from",
        ExpressionAttributeValues: {
          ":h": ipHash,
          ":from": now - LIMITS.longWindowMs,
        },
        // 件数を数えるだけなので取得属性は sentAt のみ（転送量を抑える）。
        ProjectionExpression: "sentAt",
        // 強整合にはしない（結合性より可用性を優先。多少の取りこぼしは fail open の方針と整合）。
        ConsistentRead: false,
      }),
    );

    const items = res.Items ?? [];
    // TTL の削除は遅延しうるため、必ず保存された sentAt で窓を絞り直す（TTL は判定の正確性を担保しない）。
    const inLongWindow = items.filter(
      (it) => typeof it.sentAt === "number" && it.sentAt >= now - LIMITS.longWindowMs,
    );
    const inShortWindow = inLongWindow.filter(
      (it) => (it.sentAt as number) >= now - LIMITS.shortWindowMs,
    );

    const limited =
      inShortWindow.length >= LIMITS.shortMax || inLongWindow.length >= LIMITS.longMax;
    return { limited, ipHash };
  } catch (err) {
    console.error("[rate-limit] 件数の取得に失敗（fail open で送信を通す）:", err);
    return { limited: false, ipHash };
  }
}

/**
 * 送信1件を記録する。best-effort＝失敗しても送信自体は成功として扱う（例外を投げない）。
 * expiresAt は判定窓（1時間）より長い 2時間後（TTL 削除の遅延を見込む）。
 */
export async function recordSubmission(ipHash: string | null): Promise<void> {
  if (!ipHash) return; // IP 不明なら記録しない（判定にも使えないため）

  const now = Date.now();
  try {
    await ddbDoc.send(
      new PutCommand({
        TableName: tableName(),
        Item: {
          ipHash,
          sentAt: now, // epoch ミリ秒（SK）
          expiresAt: Math.floor((now + LIMITS.recordTtlMs) / 1000), // TTL は epoch 秒
        },
      }),
    );
  } catch (err) {
    console.error("[rate-limit] 記録の保存に失敗（送信は成功扱い）:", err);
  }
}
