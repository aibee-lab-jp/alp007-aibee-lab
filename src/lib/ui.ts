// 版面まわりの共通クラス（ブリーフ §2：余白広め・1カラム中心・モバイルファースト）。
// 同じ値を各所に書き散らさないための小さな共有。見た目の判断はここに集約する。

// 本文カラム。読み物の版面としてやや狭め（表・段落とも読みやすい幅）。
export const container = "mx-auto w-full max-w-[60rem] px-5 sm:px-8";

// セクション見出しの英字ラベル（小・トラッキング広め・差し色。§2 の2段構成の上段）。
export const sectionLabel =
  "font-sans text-xs font-medium uppercase tracking-[0.18em] text-accent-600";

// セクション見出しの日本語（主）。
export const sectionHeading =
  "mt-3 font-serif text-[clamp(1.5rem,4.5vw,2rem)] font-medium leading-[1.4] text-ink-900";

// 本文段落。行間広め（§2）。
export const paragraph =
  "font-sans text-[clamp(0.9375rem,2.6vw,1.0625rem)] leading-[1.95] text-ink-700";
