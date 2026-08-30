import Link from "next/link";
import { home } from "@/lib/site-content";
import { container, paragraph } from "@/lib/ui";
import { SectionHeading } from "./SectionHeading";

// アイビーラボ（会社概要・ブリーフ §4.1）。
// 代表名・電話番号・メールアドレスは記載しない（確定）。所在地はテキストのみ（地図の埋め込みなし）。
export function About() {
  const { id, label, heading, items, cta } = home.about;

  return (
    <section id={id} className="scroll-mt-24 py-16 sm:py-20">
      <div className={container}>
        <SectionHeading label={label} heading={heading} />

        <dl className="border-t border-line">
          {items.map((item) => (
            <div
              key={item.key}
              className="grid gap-1.5 border-b border-line py-5 sm:grid-cols-[10rem_1fr] sm:gap-8 sm:py-6"
            >
              <dt className="font-sans text-sm font-medium tracking-[0.06em] text-ink-500">
                {item.key}
              </dt>
              <dd className={`max-w-[52ch] ${paragraph}`}>{item.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-12">
          <Link
            href={cta.href}
            className="inline-flex items-center justify-center rounded-md bg-accent-600 px-7 py-3.5 font-sans text-[0.9375rem] font-medium text-base-100 transition-colors hover:bg-accent-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600"
          >
            {cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
