"use server";

import { randomUUID } from "node:crypto";
import {
  validateContactInput,
  type ContactInput,
  type ContactResult,
} from "@/lib/contact-types";
import {
  saveContactRecord,
  sendConfirmationEmail,
  sendOwnerNotification,
} from "@/lib/contact-service";
import { checkRateLimit, getClientIp, recordSubmission } from "@/lib/contact-rate-limit";
import { contact } from "@/lib/site-content";

// 問い合わせ送信の Server Action（このファイルからは1アクションのみ export）。
// フロー（§5）：ハニーポット → サーバ側再検証 → レート制限判定（fail open）
//   → DynamoDB 保存（＝受付の一次記録・唯一のゲート） → レート制限の記録（best-effort）
//   → 確認/通知メールは best-effort（失敗してもログのみ・アクションは成功）。
// 保存成功後にメール一時障害で失敗を返すとユーザーが再送して DynamoDB に重複が生じるため、
// 保存成功＝受付完了とする（§5）。
export async function submitContact(input: ContactInput): Promise<ContactResult> {
  // ハニーポット：値が入っていれば bot とみなし、保存も送信もせず「成功扱い」で静かに破棄する。
  if (input.honeypot && input.honeypot.trim() !== "") {
    return { ok: true };
  }

  // サーバ側バリデーション（クライアントを信用しない）。
  const v = validateContactInput(input);
  if (!v.ok) {
    return { ok: false, error: contact.notices.submitFailed, fieldErrors: v.fieldErrors };
  }

  // レート制限（§5）。位置は「ハニーポット → バリデーション」の後、「DynamoDB 保存」の前。
  //  - 前に置かない理由：弾かれる入力にまで DynamoDB の読み取りを走らせるのは無駄。
  //  - 後に置かない理由：制限に達した送信を保存・メール送信してからでは止められない。
  // 判定に失敗した場合・IP が取れない場合は通す（fail open）。
  const ip = await getClientIp();
  const { limited, ipHash } = await checkRateLimit(ip);
  if (limited) {
    // 閾値や残り時間は明かさない（回避の手がかりになるため・§5）。
    return { ok: false, error: contact.notices.rateLimited };
  }

  const record = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    lastName: input.lastName.trim(),
    firstName: input.firstName.trim(),
    email: input.email.trim(),
    subject: input.subject.trim(),
    body: input.body.trim(),
  };

  // (a) DynamoDB 保存＝受付の一次記録。**唯一のゲート**：ここが失敗したときだけアクションを失敗にする。
  try {
    await saveContactRecord(record);
  } catch (err) {
    console.error("[contact] DynamoDB 保存に失敗（受付できず）:", err);
    return { ok: false, error: contact.notices.submitFailed };
  }

  // レート制限の記録（§5）。**保存が成功した＝受付が成立した送信だけ**を数える
  //  - 拒否した送信を記録すると窓が延び続けて復帰できなくなる。
  //  - バリデーションエラー／ハニーポット検出はここへ到達しない（手前で return）。
  // best-effort：記録の失敗は送信の成否に影響させない（recordSubmission は例外を投げない）。
  await recordSubmission(ipHash);

  // (b)(c) メールは best-effort：保存済みなので送信に失敗してもアクションは成功（ログのみ）。
  //   並行送信し、rejected をどのメールか分かる形でログに残す（Lambda の CloudWatch に出る）。
  //   ※通知メールに本文を含めない方針は sendOwnerNotification 側で担保する。
  const mail = await Promise.allSettled([
    sendConfirmationEmail(record), // (b) 送信者へ確認メール（受付内容の控えを含む）
    sendOwnerNotification(record), // (c) 運営へ通知（件名のみ）
  ]);
  const mailLabels = ["確認メール（送信者宛）", "通知メール（運営宛）"];
  mail.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(
        `[contact] ${mailLabels[i]} の送信に失敗（保存は完了済みのため受付は成功扱い）:`,
        r.reason,
      );
    }
  });

  return { ok: true };
}
