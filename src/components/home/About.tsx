import Link from "next/link";
import { home } from "@/lib/site-content";
import { container, sectionGrid, sectionPadding } from "@/lib/ui";
import { SectionHeading } from "./SectionHeading";

// アイビーラボ（会社概要・ブリーフ §4.1／キャンバス v2）。
// 代表名・電話番号・メールアドレスは記載しない（確定）。所在地はテキストのみ（地図の埋め込みなし）。
export function About() {
  const { id, label, heading, items, cta } = home.about;

  return (
    <section id={id} className={`scroll-mt-24 border-t border-line-soft ${sectionPadding}`}>
      <div className={container}>
        <div className={sectionGrid}>
          <SectionHeading label={label} heading={heading} />

          <div>
            <dl className="mb-10 border-b border-line lg:mb-11">
              {items.map((item) => (
                <div
                  key={item.key}
                  className="grid grid-cols-[76px_1fr] gap-3.5 border-t border-line py-4 lg:grid-cols-[160px_1fr] lg:gap-8 lg:py-5.5"
                >
                  <dt className="pt-0.5 text-[12.5px] text-ink-400 lg:pt-0 lg:text-[13px]">
                    {item.key}
                  </dt>
                  <dd className="text-[13.5px] leading-[1.95] text-ink-800 lg:text-[14.5px] lg:leading-[2]">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>

            <Link
              href={cta.href}
              className="block rounded-[2px] bg-accent py-4 text-center text-[14.5px] font-medium tracking-[0.06em] text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:inline-block lg:px-12 lg:text-[14px] lg:tracking-[0.08em]"
            >
              {cta.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
