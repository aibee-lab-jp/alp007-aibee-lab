import { home } from "@/lib/site-content";
import { container, paragraph } from "@/lib/ui";

// ヒーロー（ブリーフ §4.1）。CTA ボタン・とりあえず47 への導線は置かない（導線は #services とフッター）。
export function Hero() {
  return (
    <section id="hero" className="scroll-mt-24 pt-16 pb-16 sm:pt-24 sm:pb-24">
      <div className={container}>
        <p className="font-sans text-[0.8125rem] font-medium tracking-[0.12em] text-accent-600">
          {home.hero.kicker}
        </p>
        <h1 className="mt-5 max-w-[22ch] font-serif text-[clamp(1.875rem,7vw,3rem)] font-medium leading-[1.35] text-balance text-ink-900">
          {home.hero.title}
        </h1>
        <p className={`mt-8 max-w-[46ch] ${paragraph}`}>{home.hero.lead}</p>
      </div>
    </section>
  );
}
