"use client";

import { useState, useSyncExternalStore } from "react";
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

// 入力欄の共通スタイル（白地＋薄い罫＋focus で差し色のリング）。
// エラー時は枠線を danger に（aria-invalid と併せて色以外でも伝わるようメッセージを出す）。
const fieldBase =
  "w-full rounded-md border border-line bg-base-100 px-4 py-3 font-sans text-base text-ink-900 outline-none transition-[border-color,box-shadow] placeholder:text-ink-400 focus:border-accent-600 focus:shadow-[0_0_0_3px_var(--color-accent-100)] aria-[invalid=true]:border-danger-600";

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
      }
    } catch {
      // ネットワーク等で Server Action 自体に到達できなかった場合。
      setFormError(contact.notices.submitFailed);
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
        className="py-6"
        style={{ animation: "al-fade 320ms cubic-bezier(0.2, 0.8, 0.3, 1)" }}
      >
        <div className="mb-6 flex size-11 items-center justify-center rounded-full border border-accent-600 text-accent-600">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 className="font-serif text-[clamp(1.375rem,4.5vw,1.75rem)] font-medium leading-[1.45] text-ink-900">
          {contact.thanks.heading}
        </h2>
        <p className={`mt-5 max-w-[46ch] ${paragraph}`}>{contact.thanks.body}</p>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
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

      {/* 姓・名 */}
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
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
        <div className="min-w-0 flex-1">
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
          rows={8}
          aria-required="true"
          aria-invalid={!!errors.body}
          aria-describedby={errors.body ? "cf-body-error" : undefined}
          placeholder={contact.fields.body.placeholder}
          value={values.body}
          onChange={setField("body")}
          className={`${fieldBase} min-h-[11rem] resize-y leading-[1.8]`}
        />
      </Field>

      {/* 通知枠（送信エラー／レート制限拒否／SW 未制御で共通・ブリーフ §8）＋送信ボタン */}
      <div className="mt-2 flex flex-col gap-4">
        {formError && <Notice>{formError}</Notice>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-accent-600 px-7 py-3.5 font-sans text-[0.9375rem] font-medium text-base-100 transition-colors hover:bg-accent-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 disabled:opacity-60 sm:w-auto sm:self-start sm:px-10"
        >
          {pending ? contact.submitting : contact.submit}
        </button>
      </div>

      {/* 取り扱いの参照（ブリーフ §4.2） */}
      <p className="font-sans text-[0.8125rem] leading-[1.8] text-ink-500">
        {contact.privacyNote.before}
        <Link
          href="/privacy"
          className="text-accent-600 underline decoration-accent-100 decoration-1 underline-offset-4 transition-colors hover:text-accent-700 hover:decoration-accent-600"
        >
          {contact.privacyNote.linkLabel}
        </Link>
        {contact.privacyNote.after}
      </p>
    </form>
  );
}
