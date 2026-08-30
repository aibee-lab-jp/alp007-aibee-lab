// contact の永続化（DynamoDB）とメール送信（SES v2）。**サーバ専用**
// ＝クライアントから値 import しないこと（実 import するのは Server Action のみ）。
// 設定値は環境変数から読む（ハードコード禁止）。リージョンは実行時 AWS_REGION を SDK が自動取得。
//
// 文面はブリーフ §5 の確定文言。SES テンプレートではなくここ（TS）で組み立てる理由（§5）：
// テンプレートのプレースホルダは変数名のズレを検出できず空欄のまま送信されるが、TS なら型とビルドで落ちる。
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { env } from "@/lib/env";

// Lambda のウォーム再利用のためモジュールスコープで生成（生成時に認証情報・通信は不要）。
const ddbDoc = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ses = new SESv2Client({});

export type ContactRecord = {
  id: string; // パーティションキー（UUID）
  createdAt: string; // ISO 文字列
  lastName: string;
  firstName: string;
  email: string;
  subject: string;
  body: string;
};

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

// 差出人の表示名（確定・ブリーフ §5）。
// SES は SMTPUTF8（RFC 6531）非対応のため、非 ASCII の friendly-from 名は RFC 2047 の
// MIME encoded-word（=?UTF-8?B?...?=）で渡す必要がある。SDK（@aws-sdk/client-sesv2）は
// 自動エンコードしないため自前でエンコードする（生の日本語のままだと受信箱で文字化けする）。
const SENDER_DISPLAY_NAME = "アイビーラボ お問い合わせ窓口";

// UTF-8 文字列を RFC 2047 の Base64 encoded-word に変換する。
// ※ 本表示名は encoded-word 全体で 75 文字以内に収まるため単一 encoded-word でよい。
function encodeMimeWord(text: string): string {
  return `=?UTF-8?B?${Buffer.from(text, "utf8").toString("base64")}?=`;
}

// From ヘッダー値。アドレスは環境変数 SES_SENDER_ADDRESS をそのまま使い（ハードコードしない）、
// 表示名だけコードで付ける。確認メール・通知メールの両方で使う。
function senderFrom(): string {
  return `${encodeMimeWord(SENDER_DISPLAY_NAME)} <${requiredEnv("SES_SENDER_ADDRESS")}>`;
}

// 通知メールの「受付日時」。Lambda の TZ は UTC のため、日本時間で明示的に整形する。
function formatReceivedAt(iso: string): string {
  const formatted = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
  return `${formatted}（JST）`;
}

// (a) DynamoDB へ1件保存（単純な PutItem。GSI・ソートキーなし）＝受付の一次記録（§5）。
export async function saveContactRecord(record: ContactRecord): Promise<void> {
  await ddbDoc.send(
    new PutCommand({
      TableName: requiredEnv("CONTACT_TABLE_NAME"),
      Item: record,
    }),
  );
}

// (b) 送信者本人へ受付確認メール。受付内容の控え（件名・本文）を含める（ブリーフ §5 の確定文言）。
// 控えを載せるのは、送った内容が反映されていること自体が正規メールの根拠になるため（§5）。
export async function sendConfirmationEmail(record: ContactRecord): Promise<void> {
  const divider = "──────────────────────";
  const bodyText = [
    `${record.lastName} ${record.firstName} 様`,
    "",
    "アイビーラボへお問い合わせいただき、ありがとうございます。",
    "以下の内容で受け付けました。",
    "",
    divider,
    `件名：${record.subject}`,
    "本文：",
    record.body,
    divider,
    "",
    "内容を確認のうえ、必要に応じてこのメールアドレス宛にご連絡いたします。",
    "※すべてのお問い合わせにご返信できるとは限りません。あらかじめご了承ください。",
    "",
    "このメールは送信専用のアドレスから送信しています。ご返信いただいてもお答えできません。",
    "このメールに心当たりがない場合は、お手数ですが破棄してください。",
    "",
    "アイビーラボ",
    // 署名の URL は env から（§2：コードに URL をハードコードしない。dev では dev の URL が入る）。
    env.siteUrl,
  ].join("\n");

  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: senderFrom(),
      Destination: { ToAddresses: [record.email] },
      Content: {
        Simple: {
          Subject: { Data: "【アイビーラボ】お問い合わせを受け付けました", Charset: "UTF-8" },
          Body: {
            Text: { Data: bodyText, Charset: "UTF-8" },
          },
        },
      },
    }),
  );
}

// (c) 運営への通知メール。**重要：本文(body)は絶対に含めない**（件名のみ。§5）。
// 運営がネガティブな本文を直接読まずに新着と概要だけ把握できる緩衝層とするため。本文は DynamoDB を見る。
export async function sendOwnerNotification(record: ContactRecord): Promise<void> {
  const to = requiredEnv("CONTACT_NOTIFY_ADDRESS");
  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: senderFrom(),
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: {
            Data: `【aibee-lab.jp】新しいお問い合わせ：${record.subject}`,
            Charset: "UTF-8",
          },
          Body: {
            Text: {
              Data: [
                "新しいお問い合わせを受け付けました。",
                "",
                `受付日時：${formatReceivedAt(record.createdAt)}`,
                `件名：${record.subject}`,
                "",
                "※本文は保存先（DynamoDB）で確認してください。",
              ].join("\n"),
              Charset: "UTF-8",
            },
          },
        },
      },
    }),
  );
}
