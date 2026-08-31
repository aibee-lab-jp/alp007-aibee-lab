import { home } from "@/lib/site-content";
import { container, sectionGrid, sectionPadding } from "@/lib/ui";
import { SectionHeading } from "./SectionHeading";

// 沿革（ブリーフ §4.1／キャンバス v2）。年（差し色）＋内容の対を細い罫で組む。
// 2026 は「開始」のまま（ブリーフ §8 の申し送り）。
export function History() {
  const { id, label, heading, items } = home.history;

  return (
    <section
      id={id}
      className={`scroll-mt-24 border-t border-line-soft bg-surface ${sectionPadding}`}
    >
      <div className={container}>
        <div className={sectionGrid}>
          <SectionHeading label={label} heading={heading} />

          <dl className="border-b border-line">
            {items.map((item) => (
              <div
                key={item.year}
                className="grid grid-cols-[58px_1fr] gap-3.5 border-t border-line py-4 lg:grid-cols-[120px_1fr] lg:gap-8 lg:py-5.5"
              >
                <dt className="pt-px text-[14px] font-semibold tracking-[0.02em] text-accent lg:pt-0 lg:text-[19px] lg:font-bold lg:tracking-[-0.01em]">
                  {item.year}
                </dt>
                <dd className="text-[13.5px] leading-[1.95] text-ink-800 lg:text-[14.5px] lg:leading-[2]">
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
