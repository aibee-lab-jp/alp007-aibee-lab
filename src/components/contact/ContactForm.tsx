"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { submitContact } from "@/app/contact/actions";
import { contact } from "@/lib/site-content";
import {
  EMAIL_RE,
  type ContactErrorCode,
  type ContactFieldKey,
} from "@/lib/contact-types";
import { paragraph } from "@/lib/ui";
import { Field } from "./Field";
import { Notice } from "./Notice";

type Values = Record<ContactFieldKey, string>;
type Errors = Partial<Record<ContactFieldKey, ContactErrorCode>>;

const EMPTY: Values = { lastName: "", firstName: "", email: "", subject: "", body: "" };

// useSyncExternalStore 用：ブラウザの SW 対応可否は途中で変化しないため購読は行わない
// （毎レンダーで新しい関数を渡すと再購読が走るのでモジュールスコープに置く）。
const subscribeNever = () => () => {};

// ※ モックの本文欄に入っていたサンプル入力は表示確認用のダミー（ブリーフ §8）。
//    初期値にもプレースホルダにもしない。プレースホルダは §4.2 の確定文言（site-content）。

// 入力欄の共通スタイル（キャンバス v2：白地＋細い罫・角丸 2px、focus で枠が差し色に変わる）。
// モバイルは 16px（iOS の自動ズームを避ける）、デスクトップは 15px。
// エラー時は枠と地を danger 系に（aria-invalid と併せ、色以外でもメッセージで伝える）。
const fieldBase =
  "w-full rounded-[2px] border border-field bg-white px-3.5 py-[13px] text-[16px] text-ink-900 outline-none transition-colors placeholder:text-placeholder focus:border-accent aria-[invalid=true]:border-danger-line aria-[invalid=true]:bg-danger-field lg:text-[15px]";

function errorMessage(key: ContactFieldKey, code: ContactErrorCode): string {
  if (key === "email" && code === "format") return contact.emailFormatError;
  return contact.requiredError(contact.fields[key].label);
}

export function ContactForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 送信に失敗した／入力エラーが出たときに、その箇所まで画面を送るための合図（表示側の手当て）。
  // 【なぜ必要か】通知枠はキャンバスどおりフォームの先頭に置くため、画面下端で送信すると失敗しても
  // 視界に変化が無く「何も起きていない」と受け取られる。再送は DynamoDB の重複を招くため避けたい（§5）。
  // 値ではなく更新回数（seq）で発火させるので、同じ文言のエラーが続けて起きても毎回スクロールする。
  const [scrollCue, setScrollCue] = useState<{ to: "notice" | "field"; seq: number } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);

  const cueScroll = (to: "notice" | "field") =>
    setScrollCue((c) => ({ to, seq: (c?.seq ?? 0) + 1 }));

  // 実際のスクロールは描画後に行う（通知枠もエラー表示もこの時点で初めて DOM に存在する）。
  useEffect(() => {
    if (!scrollCue) return;
    const target =
      scrollCue.to === "notice"
        ? noticeRef.current
        : // 最初のエラー欄（DOM 順＝姓 → 名 → メール → 件名 → 本文）。
          formRef.current?.querySelector('[aria-invalid="true"]');
    // behavior: "auto" は CSS の scroll-behavior に委ねる指定。globals.css は通常 smooth、
    // prefers-reduced-motion: reduce のときは auto（＝即座に移動）にしているため、
    // 動きを減らす設定を自動的に尊重できる。
    target?.scrollIntoView({ behavior: "auto", block: "center" });
  }, [scrollCue]);

  // Service Worker 非対応ブラウザの判定（§5）。この環境では送信が必ず 403 になるため、
  // 入力させる前にフォームを描画せず案内に差し替える。
  //
  // 【ハイドレーション対策】判定は navigator に触れるためクライアントでしか行えない。
  // useSyncExternalStore にサーバー用スナップショット（= 未判定として「対応あり」）を与えることで、
  // SSG された HTML とハイドレーション時の描画を一致させ、判定後の値が違えば再描画させる。
  // ※ §5 の実装知見は「初期値 null ＋ useEffect」で同じ効果を得る手だが、eslint の
  //   react-hooks/set-state-in-effect（effect 内の同期 setState 禁止）に触れるため、
  //   同じ目的を満たす React 公式の外部ストア API に置き換えている（挙動は同じ）。
  const swSupported = useSyncExternalStore(
    subscribeNever,
    () => "serviceWorker" in navigator,
    () => true,
  );
  const swUnsupported = !swSupported;

  const setField =
    (key: ContactFieldKey) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = e.target.value;
      setValues((s) => ({ ...s, [key]: v }));
      setErrors((s) => ({ ...s, [key]: undefined }));
    };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!values.lastName.trim()) e.lastName = "required";
    if (!values.firstName.trim()) e.firstName = "required";
    if (!values.email.trim()) e.email = "required";
    else if (!EMAIL_RE.test(values.email.trim())) e.email = "format";
    if (!values.subject.trim()) e.subject = "required";
    if (!values.body.trim()) e.body = "required";
    return e;
  };

  const onSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const form = ev.currentTarget;
    setFormError(null);

    // クライアント側検証。NG なら送信しない。
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      cueScroll("field");
      return;
    }

    // Service Worker 未制御のフォールバック（§5）。CloudFront OAC 経由では POST に
    // x-amz-content-sha256 が必要で、それを付けるのは SW（public/sw.js）。SW がこのページを
    // 制御していない（初回アクセス直後・シークレットウィンドウ等）と送信は 403 になるため、
    // 黙って失敗させず送信を止め、再読み込みを促す。入力内容はそのまま保持する。
    if (
      typeof navigator !== "undefined" &&
      "serviceWorker" in navigator &&
      !navigator.serviceWorker.controller
    ) {
      setFormError(contact.notices.swUncontrolled);
      cueScroll("notice");
      return;
    }

    // ハニーポットは非制御の隠し入力なので、送信時に DOM から読む（state には持たせない）。
    const honeypot = String(new FormData(form).get("hp_company") ?? "");

    setPending(true);
    try {
      const result = await submitContact({ ...values, honeypot });
      if (result.ok) {
        setSent(true);
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        setFormError(result.error);
        cueScroll("notice");
      }
    } catch {
      // ネットワーク等で Server Action 自体に到達できなかった場合。
      setFormError(contact.notices.submitFailed);
      cueScroll("notice");
    } finally {
      setPending(false);
    }
  };

  // SW 非対応：フォームを描画せず案内のみ（§5）。
  // 「SW 未制御」（送信時の分岐）と違い再読み込みでは解決しないため、再読み込みは促さない。
  // 代替の受付経路（メール等）は用意しない＝DynamoDB 保存を一次記録とする設計を崩さないため。
  if (swUnsupported) {
    return <Notice>{contact.swUnsupported}</Notice>;
  }

  // サンクスは同一ページ内でフォームと置換する（§5）。
  if (sent) {
    return (
      <section
        aria-live="polite"
        className="border-t-2 border-accent pt-[34px] lg:pt-10"
        style={{ animation: "al-fade 320ms cubic-bezier(0.2, 0.8, 0.3, 1)" }}
      >
        <h2 className="text-[19px] font-bold leading-[1.7] tracking-[-0.005em] text-ink-900 lg:text-[23px] lg:tracking-[-0.01em]">
          {contact.thanks.heading}
        </h2>
        <p className={`mt-4.5 lg:mt-5.5 ${paragraph}`}>{contact.thanks.body}</p>
      </section>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate>
      {/* ハニーポット（画面外・bot 対策）。値が入っていれば Server Action 側で静かに破棄する。 */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="hp_company">会社名（入力しないでください）</label>
        <input
          id="hp_company"
          name="hp_company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      {/* 通知枠（送信エラー／レート制限拒否／SW 未制御で共通・ブリーフ §8）。
          キャンバスどおりフォームの先頭（リードの直下）に置く。 */}
      {formError && (
        <div ref={noticeRef} className="mb-9">
          <Notice>{formError}</Notice>
        </div>
      )}

      <div className="flex flex-col gap-[26px] lg:gap-7">
      {/* 姓・名 */}
      <div className="grid grid-cols-2 gap-3.5">
        <div>
          <Field
            id="cf-last"
            label={contact.fields.lastName.label}
            error={errors.lastName && errorMessage("lastName", errors.lastName)}
          >
            <input
              id="cf-last"
              name="lastName"
              type="text"
              autoComplete="family-name"
              aria-required="true"
              aria-invalid={!!errors.lastName}
              aria-describedby={errors.lastName ? "cf-last-error" : undefined}
              placeholder={contact.fields.lastName.placeholder}
              value={values.lastName}
              onChange={setField("lastName")}
              className={fieldBase}
            />
          </Field>
        </div>
        <div>
          <Field
            id="cf-first"
            label={contact.fields.firstName.label}
            error={errors.firstName && errorMessage("firstName", errors.firstName)}
          >
            <input
              id="cf-first"
              name="firstName"
              type="text"
              autoComplete="given-name"
              aria-required="true"
              aria-invalid={!!errors.firstName}
              aria-describedby={errors.firstName ? "cf-first-error" : undefined}
              placeholder={contact.fields.firstName.placeholder}
              value={values.firstName}
              onChange={setField("firstName")}
              className={fieldBase}
            />
          </Field>
        </div>
      </div>

      {/* メールアドレス */}
      <Field
        id="cf-email"
        label={contact.fields.email.label}
        error={errors.email && errorMessage("email", errors.email)}
      >
        <input
          id="cf-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "cf-email-error" : undefined}
          placeholder={contact.fields.email.placeholder}
          value={values.email}
          onChange={setField("email")}
          className={fieldBase}
        />
      </Field>

      {/* 件名 */}
      <Field
        id="cf-subject"
        label={contact.fields.subject.label}
        error={errors.subject && errorMessage("subject", errors.subject)}
      >
        <input
          id="cf-subject"
          name="subject"
          type="text"
          aria-required="true"
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? "cf-subject-error" : undefined}
          placeholder={contact.fields.subject.placeholder}
          value={values.subject}
          onChange={setField("subject")}
          className={fieldBase}
        />
      </Field>

      {/* 本文 */}
      <Field
        id="cf-body"
        label={contact.fields.body.label}
        error={errors.body && errorMessage("body", errors.body)}
      >
        <textarea
          id="cf-body"
          name="body"
          rows={7}
          aria-required="true"
          aria-invalid={!!errors.body}
          aria-describedby={errors.body ? "cf-body-error" : undefined}
          placeholder={contact.fields.body.placeholder}
          value={values.body}
          onChange={setField("body")}
          className={`${fieldBase} resize-y leading-[1.9]`}
        />
      </Field>

      </div>

      {/* 取り扱いの参照（ブリーフ §4.2）＋送信ボタン。
          キャンバス：モバイルは注記の下に全幅ボタン、デスクトップは同じ行の左右に置く。 */}
      <div className="mt-[26px] flex flex-col gap-[30px] lg:mt-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <p className="text-[12.5px] leading-[1.95] text-ink-600 lg:max-w-[380px]">
          {contact.privacyNote.before}
          <Link
            href="/privacy"
            className="border-b border-line-strong text-ink-600 transition-opacity hover:opacity-70"
          >
            {contact.privacyNote.linkLabel}
          </Link>
          {contact.privacyNote.after}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-[2px] bg-accent py-[17px] text-[15px] font-medium tracking-[0.06em] text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60 lg:w-auto lg:shrink-0 lg:px-14 lg:py-4 lg:text-[14.5px] lg:tracking-[0.08em]"
        >
          {pending ? contact.submitting : contact.submit}
        </button>
      </div>
    </form>
  );
}
