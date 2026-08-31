import { home } from "@/lib/site-content";
import { container, sectionGrid, sectionPadding } from "@/lib/ui";
import { SectionHeading } from "./SectionHeading";

// 事業内容（ブリーフ §4.1・3項目／キャンバス v2）。デスクトップは3カラム。
// 連番（01・02・03）は装飾で確定文言ではない（ブリーフ §8）。キャンバスに従いデスクトップのみ表示し、
// 読み上げには載せない。
export function Services() {
  const { id, label, heading, items } = home.services;

  return (
    <section
      id={id}
      className={`scroll-mt-24 border-t border-line-soft bg-surface ${sectionPadding}`}
    >
      <div className={container}>
        <div className={sectionGrid}>
          <SectionHeading label={label} heading={heading} />

          <div className="flex flex-col gap-[34px] lg:grid lg:grid-cols-3 lg:gap-12">
            {items.map((item, i) => (
              <article key={item.title}>
                <span
                  aria-hidden="true"
                  className="mb-3.5 hidden text-[11px] font-semibold tracking-[0.14em] text-ink-300 lg:block"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-[16.5px] font-semibold leading-[1.7] text-ink-900 [word-break:auto-phrase] lg:text-[18px] lg:leading-[1.65]">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-[14px] leading-[2] text-ink-600 lg:mt-3.5 lg:leading-[2.05]">
                  {item.body}
                </p>
                {"link" in item && item.link ? (
                  <a
                    href={item.link.href}
                    className="mt-3.5 inline-block border-b border-accent pb-0.5 text-[14px] font-medium text-accent transition-opacity hover:opacity-70 lg:mt-4.5 lg:pb-[3px]"
                  >
                    {item.link.label} <span aria-hidden="true">→</span>
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
