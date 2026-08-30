import { home } from "@/lib/site-content";
import { container, paragraph } from "@/lib/ui";
import { SectionHeading } from "./SectionHeading";

// 実績（ブリーフ §4.1）。見出し＋本文の対で、薄い罫・広い行間で組む（§2：表が主役級）。
// 資格の記載はしない（決定）。
export function Works() {
  const { id, label, heading, lead, items } = home.works;

  return (
    <section id={id} className="scroll-mt-24 py-16 sm:py-20">
      <div className={container}>
        <SectionHeading label={label} heading={heading} />
        <p className={`mb-10 max-w-[52ch] ${paragraph}`}>{lead}</p>

        <dl className="border-t border-line">
          {items.map((item) => (
            <div
              key={item.title}
              className="grid gap-2 border-b border-line py-6 sm:grid-cols-[16rem_1fr] sm:gap-8 sm:py-7"
            >
              <dt className="font-serif text-[1.0625rem] font-medium leading-[1.6] text-ink-900">
                {item.title}
              </dt>
              <dd className={`max-w-[52ch] ${paragraph}`}>{item.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
