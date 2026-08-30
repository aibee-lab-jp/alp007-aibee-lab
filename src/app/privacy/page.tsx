import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import Link from "next/link";
import { meta, privacy } from "@/lib/site-content";
import { container, paragraph, sectionHeading, sectionLabel } from "@/lib/ui";

// /privacy（SSG・テキスト主体）。全文はブリーフ §4.3 の確定文言（site-content に集約）。
export const metadata: Metadata = pageMetadata({
  title: meta.privacy.title,
  description: meta.privacy.description,
  path: "/privacy",
});

const headingClass =
  "font-serif text-[clamp(1.125rem,3.4vw,1.375rem)] font-medium leading-[1.5] text-ink-900";

export default function PrivacyPage() {
  // 番号はセクション順から作る（本文と番号のズレを防ぐ）。お問い合わせ先は最後（7.）。
  const numbered = privacy.sections.map((s, i) => ({ ...s, no: i + 1 }));
  const contactNo = numbered.length + 1;

  return (
    <div className="py-16 sm:py-20">
      <div className={container}>
        <header className="mb-10 sm:mb-12">
          <p className={sectionLabel}>{privacy.label}</p>
          <h1 className={sectionHeading}>{privacy.heading}</h1>
          {/* 制定日はリリース時に実日付へ差し替える（ブリーフ §4.3）。 */}
          <p className="mt-6 font-sans text-sm text-ink-500">制定日：{privacy.establishedAt}</p>
        </header>

        <div className="max-w-[46rem]">
          {numbered.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 border-t border-line py-8">
              <h2 className={headingClass}>
                {s.no}. {s.heading}
              </h2>
              <p className={`mt-4 ${paragraph}`}>{s.body}</p>
            </section>
          ))}

          <section
            id={privacy.contactSection.id}
            className="scroll-mt-24 border-y border-line py-8"
          >
            <h2 className={headingClass}>
              {contactNo}. {privacy.contactSection.heading}
            </h2>
            <p className={`mt-4 ${paragraph}`}>
              {privacy.contactSection.before}
              <Link
                href="/contact"
                className="text-accent-600 underline decoration-accent-100 decoration-1 underline-offset-4 transition-colors hover:text-accent-700 hover:decoration-accent-600"
              >
                {privacy.contactSection.linkLabel}
              </Link>
              {privacy.contactSection.after}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
