import { home } from "@/lib/site-content";
import { container } from "@/lib/ui";

// ヒーロー（キャンバス v2）。CTA ボタンは置かない。
// デスクトップは「見出し｜リード」の2カラム（下端揃え）。
// ※ 見出しの2行組みは改行タグではなくカラム幅で作る（文言に改行を混ぜない）。
// ※ キッカー（「「とりあえず47」運営元」）は暫定的に外している（site-content.ts の注記）。
//    復帰時はこの位置に差し色の小さな1行を戻す。
export function Hero() {
  return (
    <section id="hero" className="scroll-mt-24 pt-15 pb-17 lg:pt-29 lg:pb-30">
      <div className={container}>
        <div className="lg:grid lg:grid-cols-[1.08fr_1fr] lg:items-end lg:gap-18">
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
