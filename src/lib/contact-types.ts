// contact フォームの共有型とサーバ側バリデーション。
// AWS 非依存・純粋ロジックのみ＝クライアント（ContactForm）からの型参照も安全。
//
// ※ 本サイトのフォームに**カテゴリ選択は無い**（§5・ブリーフ §4.2 で決定）。
//   受け付けるのはアイビーラボ宛の連絡のみで、アプリの不具合・要望はリードの導線が
//   「とりあえず47」へ流すため、分類の必要がない。

export type ContactFieldKey = "lastName" | "firstName" | "email" | "subject" | "body";

// Server Action が受け取る入力（honeypot 含む）。
export type ContactInput = {
  lastName: string;
  firstName: string;
  email: string;
  subject: string;
  body: string;
  honeypot?: string; // ハニーポット（人間は空のはず）
};

export type ContactErrorCode = "required" | "format";

// Server Action の返り値。失敗時は表示用 error ＋ 任意の fieldErrors
// （フォームの欄エラー表示にそのまま流用できるコード形式）。
export type ContactResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      fieldErrors?: Partial<Record<ContactFieldKey, ContactErrorCode>>;
    };

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 必須＋メール形式の検証。クライアント・サーバの両方から同じ関数を使う
// （サーバはクライアントを信用せず再検証する）。
export function validateContactInput(input: ContactInput): {
  ok: boolean;
  fieldErrors: Partial<Record<ContactFieldKey, ContactErrorCode>>;
} {
  const e: Partial<Record<ContactFieldKey, ContactErrorCode>> = {};
  if (!input.lastName?.trim()) e.lastName = "required";
  if (!input.firstName?.trim()) e.firstName = "required";
  if (!input.email?.trim()) e.email = "required";
  else if (!EMAIL_RE.test(input.email.trim())) e.email = "format";
  if (!input.subject?.trim()) e.subject = "required";
  if (!input.body?.trim()) e.body = "required";
  return { ok: Object.keys(e).length === 0, fieldErrors: e };
}
