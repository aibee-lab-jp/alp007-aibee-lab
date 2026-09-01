import { home } from "@/lib/site-content";
import { container, sectionGrid, sectionPadding } from "@/lib/ui";
import { SectionHeading } from "./SectionHeading";

// 実績（キャンバス v2）。見出し＋本文の対を細い罫で組む（§2：表が主役級）。
// リード文はデスクトップでは左カラム（見出しの下）に入る。資格の記載はしない（決定）。
//
// 【モバイルの組み】本文が1〜2行だった初版から複数行の段落に変わったため、キャンバスが
// 複数行の段落に使っている組み（Services の本文＝14px・行間2、見出しとの間 10px）に合わせ、
// 行の上下余白も 20px → 24px に広げている（罫と本文が近すぎないように）。デスクトップは変更なし。
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
                className="border-t border-line py-6 lg:grid lg:grid-cols-[280px_1fr] lg:gap-10 lg:py-[26px]"
              >
                <dt className="text-[15px] font-semibold text-ink-900 lg:text-[16px] lg:leading-[1.7]">
                  {item.title}
                </dt>
                <dd className="mt-2.5 text-[14px] leading-[2] text-ink-600 lg:mt-0 lg:leading-[2.05]">
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
