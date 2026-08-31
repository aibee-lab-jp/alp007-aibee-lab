import { home } from "@/lib/site-content";
import { container, sectionGrid, sectionPadding } from "@/lib/ui";
import { SectionHeading } from "./SectionHeading";

// 実績（ブリーフ §4.1／キャンバス v2）。見出し＋本文の対を細い罫で組む（§2：表が主役級）。
// リード文はデスクトップでは左カラム（見出しの下）に入る。資格の記載はしない（決定）。
export function Works() {
  const { id, label, heading, lead, items } = home.works;

  return (
    <section id={id} className={`scroll-mt-24 border-t border-line-soft ${sectionPadding}`}>
      <div className={container}>
        <div className={sectionGrid}>
          <SectionHeading label={label} heading={heading}>
            <p className="mt-4.5 text-[13.5px] leading-[2] text-ink-600 lg:mt-5.5 lg:leading-[2.05]">
              {lead}
            </p>
          </SectionHeading>

          <dl className="border-b border-line">
            {items.map((item) => (
              <div
                key={item.title}
                className="border-t border-line py-5 lg:grid lg:grid-cols-[280px_1fr] lg:gap-10 lg:py-[26px]"
              >
                <dt className="text-[15px] font-semibold text-ink-900 lg:text-[16px] lg:leading-[1.7]">
                  {item.title}
                </dt>
                <dd className="mt-2 text-[13.5px] leading-[1.95] text-ink-600 lg:mt-0 lg:text-[14px] lg:leading-[2.05]">
                  {item.body}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
