import { home } from "@/lib/site-content";
import { container, paragraph } from "@/lib/ui";
import { SectionHeading } from "./SectionHeading";

// 事業内容（ブリーフ §4.1・3項目）。
// 連番（01・02・03）は装飾で確定文言ではない（ブリーフ §8）。読み上げには載せない。
export function Services() {
  const { id, label, heading, items } = home.services;

  return (
    <section id={id} className="scroll-mt-24 border-t border-line bg-base-100 py-16 sm:py-20">
      <div className={container}>
        <SectionHeading label={label} heading={heading} />

        <div className="flex flex-col gap-12 sm:gap-14">
          {items.map((item, i) => (
            <article key={item.title} className="sm:grid sm:grid-cols-[4rem_1fr] sm:gap-6">
              <span
                aria-hidden="true"
                className="font-sans text-sm font-medium tracking-[0.14em] text-accent-500"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="mt-3 sm:mt-0">
                <h3 className="font-serif text-[clamp(1.125rem,3.4vw,1.375rem)] font-medium leading-[1.5] text-ink-900">
                  {item.title}
                </h3>
                <p className={`mt-4 max-w-[52ch] ${paragraph}`}>{item.body}</p>
                {"link" in item && item.link ? (
                  <a
                    href={item.link.href}
                    className="mt-5 inline-flex items-center gap-1.5 font-sans text-[0.9375rem] font-medium text-accent-600 underline decoration-accent-100 decoration-1 underline-offset-4 transition-colors hover:text-accent-700 hover:decoration-accent-600"
                  >
                    {item.link.label}
                    <span aria-hidden="true">→</span>
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
