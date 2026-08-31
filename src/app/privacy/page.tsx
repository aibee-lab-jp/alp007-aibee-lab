import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import Link from "next/link";
import { meta, privacy } from "@/lib/site-content";
import { container, paragraph, sectionGrid, sectionHeading, sectionLabel } from "@/lib/ui";

// /privacy（SSG・テキスト主体）。全文はブリーフ §4.3 の確定文言（site-content に集約）。
export const metadata: Metadata = pageMetadata({
  title: meta.privacy.title,
  description: meta.privacy.description,
  path: "/privacy",
});

// 節見出し（キャンバス v2：モバイル 16px / デスクトップ 17.5px・semibold）。
const headingClass =
  "text-[16px] font-semibold leading-[1.7] text-ink-900 lg:text-[17.5px]";

export default function PrivacyPage() {
  // 番号はセクション順から作る（本文と番号のズレを防ぐ）。お問い合わせ先は最後（7.）。
  const numbered = privacy.sections.map((s, i) => ({ ...s, no: i + 1 }));
  const contactNo = numbered.length + 1;

  return (
    <div className="pt-13 pb-18 lg:pt-24 lg:pb-30">
      <div className={container}>
        <div className={sectionGrid}>
          <header className="mb-11 lg:mb-0">
            <p className={sectionLabel}>{privacy.label}</p>
            <h1 className={`${sectionHeading} text-[25px] leading-[1.5] lg:text-[26px]`}>
              {privacy.heading}
            </h1>
            {/* 制定日はリリース時に実日付へ差し替える（ブリーフ §4.3）。 */}
            <p className="mt-3.5 text-[12.5px] tracking-[0.02em] text-ink-400">
              制定日：{privacy.establishedAt}
            </p>
          </header>

          <div className="flex flex-col gap-[38px] lg:max-w-[720px] lg:gap-[46px]">
            {numbered.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className={headingClass}>
                  {s.no}. {s.heading}
                </h2>
                <p className={`mt-3 text-pretty lg:mt-3.5 ${paragraph}`}>{s.body}</p>
              </section>
            ))}

            <section id={privacy.contactSection.id} className="scroll-mt-24">
              <h2 className={headingClass}>
                {contactNo}. {privacy.contactSection.heading}
              </h2>
              <p className={`mt-3 text-pretty lg:mt-3.5 ${paragraph}`}>
                {privacy.contactSection.before}
                <Link
                  href="/contact"
                  className="border-b border-accent text-accent transition-opacity hover:opacity-70"
                >
                  {privacy.contactSection.linkLabel}
                </Link>
                {privacy.contactSection.after}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
