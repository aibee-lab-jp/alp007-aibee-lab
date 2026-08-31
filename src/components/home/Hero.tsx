import { home } from "@/lib/site-content";
import { container } from "@/lib/ui";

// ヒーロー（ブリーフ §4.1／キャンバス v2）。CTA ボタン・とりあえず47 への導線は置かない。
// デスクトップはキッカーの下に「見出し｜リード」の2カラム（下端揃え）。
// ※ 見出しの2行組みは改行タグではなくカラム幅で作る（文言に改行を混ぜない）。
export function Hero() {
  return (
    <section id="hero" className="scroll-mt-24 pt-15 pb-17 lg:pt-29 lg:pb-30">
      <div className={container}>
        <p className="text-[12px] font-medium tracking-[0.1em] text-accent lg:text-[13px] lg:tracking-[0.14em]">
          {home.hero.kicker}
        </p>
        <div className="mt-[18px] lg:mt-[26px] lg:grid lg:grid-cols-[1.08fr_1fr] lg:items-end lg:gap-18">
          <h1 className="text-[29px] font-bold leading-[1.55] tracking-[-0.01em] text-pretty text-ink-900 [word-break:auto-phrase] lg:text-[52px] lg:leading-[1.45] lg:tracking-[-0.02em]">
            {home.hero.title}
          </h1>
          <p className="mt-[26px] text-[14.5px] leading-[2.05] text-pretty text-ink-600 lg:mt-0 lg:mb-2 lg:text-[15px] lg:leading-[2.15]">
            {home.hero.lead}
          </p>
        </div>
      </div>
    </section>
  );
}
