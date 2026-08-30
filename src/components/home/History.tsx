import { home } from "@/lib/site-content";
import { container, paragraph } from "@/lib/ui";
import { SectionHeading } from "./SectionHeading";

// 沿革（ブリーフ §4.1）。年＋内容。2026 は「開始」のまま（ブリーフ §8 の申し送り）。
export function History() {
  const { id, label, heading, items } = home.history;

  return (
    <section id={id} className="scroll-mt-24 border-t border-line bg-base-100 py-16 sm:py-20">
      <div className={container}>
        <SectionHeading label={label} heading={heading} />

        <dl className="border-t border-line">
          {items.map((item) => (
            <div
              key={item.year}
              className="grid gap-1.5 border-b border-line py-5 sm:grid-cols-[8rem_1fr] sm:gap-8 sm:py-6"
            >
              <dt className="font-sans text-[0.9375rem] font-medium tracking-[0.08em] text-accent-600">
                {item.year}
              </dt>
              <dd className={`max-w-[52ch] ${paragraph}`}>{item.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
